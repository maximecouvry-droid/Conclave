import 'server-only';
import { db } from './supabase-server';
import { HttpError, must, type Authed } from './server';
import { pushSnapshot } from './history';
import { computeQual, finalTotals, pick, resolveElim, shuffle, type ElimBallot, type ElimPlan, type QualPlan } from './engine';
import type { FinalState, Room, RoomState, RvState } from './types';

/**
 * Machine à états de la partie. Chaque action est déclenchée par l'hôte.
 * Les résultats (tirages, dépouillement) sont calculés ici et stockés dans
 * room_secrets ; on ne publie dans rooms.state que ce qui est DÉJÀ révélé.
 */

interface Secrets {
  qual?: QualPlan;
  elim?: ElimPlan;
  final?: { order: string[]; allocs: Record<string, Record<string, number>>; cards: Record<string, boolean> };
}

const ok = (c: unknown, msg: string, status = 409) => {
  if (!c) throw new HttpError(status, msg);
};

async function getSecrets(roomId: string): Promise<Secrets> {
  const r = await db().from('room_secrets').select('data').eq('room_id', roomId).maybeSingle();
  return (r.data?.data ?? {}) as Secrets;
}
const putSecrets = async (roomId: string, data: Secrets) => must(await db().from('room_secrets').upsert({ room_id: roomId, data }));
const putRoom = async (roomId: string, patch: { phase?: string; round?: number; state: RoomState }) =>
  must(await db().from('rooms').update(patch).eq('id', roomId));

async function playerIds(roomId: string): Promise<string[]> {
  const r = await db().from('players').select('id').eq('room_id', roomId).order('created_at');
  return (r.data ?? []).map((p) => p.id as string);
}
async function ballots(roomId: string, phase: string, round: number) {
  const r = await db().from('ballots').select('player_id,type,payload').eq('room_id', roomId).eq('phase', phase).eq('round', round);
  return (r.data ?? []) as { player_id: string; type: string; payload: Record<string, unknown> }[];
}
async function allVoted(room: Room) {
  const ids = await playerIds(room.id);
  const voted = room.state.voted ?? [];
  ok(ids.length > 0 && ids.every((i) => voted.includes(i)), "Tout le monde n'a pas encore voté");
  return ids;
}

const NO_SNAPSHOT = new Set(['timer-start', 'timer-reset', 'delete-room']);

export async function runAction(a: Authed, type: string, b: Record<string, unknown>) {
  const { room } = a;
  const s = room.state;
  if (!NO_SNAPSHOT.has(type)) await pushSnapshot(room.id);

  switch (type) {
    /* ---------- chrono partagé ---------- */
    case 'timer-start': {
      const dur = Math.max(5, Math.min(300, Number(b.dur) || 60));
      return putRoom(room.id, { state: { ...s, timer: { endsAt: Date.now() + dur * 1000, dur } } });
    }
    case 'timer-reset':
      return putRoom(room.id, { state: { ...s, timer: null } });

    /* ---------- qualifs ---------- */
    case 'qual-reveal': {
      ok(room.phase === 'qual' && s.stage === 'voting', 'Étape invalide');
      await allVoted(room);
      const ids = ((await db().from('marathons').select('id').eq('room_id', room.id)).data ?? []).map((m) => m.id as string);
      const picks = (await ballots(room.id, 'qual', room.round)).map((x) => x.payload.picks as string[]);
      const plan = computeQual(ids, picks);
      await putSecrets(room.id, { qual: plan });
      const n = plan.ranked.length;
      return putRoom(room.id, {
        phase: 'qr',
        state: { stage: 'reveal', qr: { n, aboveN: n - (plan.coin ? plan.coin.spots : 0), revealed: [], coin: plan.coin } },
      });
    }
    case 'qr-next': {
      ok(room.phase === 'qr' && s.qr, 'Étape invalide');
      const plan = (await getSecrets(room.id)).qual;
      ok(plan, 'Plan introuvable', 500);
      const qr = s.qr!;
      ok(qr.revealed.length < qr.n, 'Tout est déjà révélé');
      const pos = qr.n - qr.revealed.length;
      const id = plan!.ranked[pos - 1];
      const revealed = [...qr.revealed, { id, pos, count: plan!.counts[id], drawn: pos > qr.aboveN }];
      must(await db().from('marathons').update({ qual_count: plan!.counts[id] }).eq('id', id));
      const next = { ...qr, revealed, dropped: revealed.length === qr.n ? plan!.dropped : undefined };
      if (next.dropped) for (const d of next.dropped) must(await db().from('marathons').update({ qual_count: plan!.counts[d] }).eq('id', d));
      return putRoom(room.id, { state: { ...s, qr: next } });
    }
    case 'to-plead': {
      ok(room.phase === 'qr' && s.qr && s.qr.revealed.length === s.qr.n, 'Étape invalide');
      const ranked = (await getSecrets(room.id)).qual!.ranked;
      must(await db().from('marathons').update({ status: 'out' }).eq('room_id', room.id));
      must(await db().from('marathons').update({ status: 'alive' }).in('id', ranked));
      return putRoom(room.id, { phase: 'plead', state: { stage: 'lobby', alive: ranked, out: [], timer: null } });
    }

    /* ---------- plaidoiries -> éliminations / finale ---------- */
    case 'to-elim': {
      ok(room.phase === 'plead', 'Étape invalide');
      const alive = s.alive ?? [];
      return putRoom(room.id, { phase: alive.length <= 3 ? 'final' : 'elim', round: 1, state: { stage: 'lobby', alive, out: s.out ?? [], voted: [], timer: null } });
    }
    case 'start-vote': {
      ok((room.phase === 'elim' || room.phase === 'final') && s.stage === 'lobby', 'Étape invalide');
      return putRoom(room.id, { state: { ...s, stage: 'voting', voted: [], timer: null } });
    }

    /* ---------- éliminations ---------- */
    case 'resolve': {
      ok(room.phase === 'elim' && s.stage === 'voting', 'Étape invalide');
      await allVoted(room);
      const bs: ElimBallot[] = (await ballots(room.id, 'elim', room.round)).map((x) => ({
        playerId: x.player_id,
        type: x.type as 'vote' | 'card',
        target: x.payload.target as string,
      }));
      const plan = resolveElim(s.alive ?? [], bs);
      await putSecrets(room.id, { ...(await getSecrets(room.id)), elim: plan });
      return putRoom(room.id, { state: { ...s, stage: 'reveal', rv: { step: 0 } } });
    }
    case 'rv-next': {
      ok(room.phase === 'elim' && s.stage === 'reveal' && s.rv, 'Étape invalide');
      const plan = (await getSecrets(room.id)).elim;
      ok(plan, 'Plan introuvable', 500);
      const rv: RvState = { ...s.rv!, step: s.rv!.step + 1 };
      if (s.rv!.step === 0) {
        if (plan!.kind === 'card') {
          rv.kind = 'card';
          rv.card = { coin: plan!.coin, target: plan!.coin ? null : plan!.targets[0], returned: plan!.returned };
        } else {
          rv.kind = 'nocard';
          rv.n = plan!.order.length;
          rv.votes = [];
        }
      } else if (plan!.kind === 'card') {
        ok(rv.card && rv.card.target === null, 'Déjà tiré au sort');
        rv.card = { ...rv.card!, target: plan!.targets[0] };
      } else {
        const votes = rv.votes ?? [];
        ok(votes.length < plan!.order.length, 'Tous les bulletins sont ouverts');
        rv.votes = [...votes, plan!.order[votes.length]];
        if (rv.votes.length === plan!.order.length) {
          rv.outcome =
            plan!.kind === 'stay'
              ? { kind: 'stay', targets: [], tied: plan!.tied, toFinal: plan!.toFinal }
              : { kind: plan!.kind, targets: plan!.targets };
        }
      }
      return putRoom(room.id, { state: { ...s, rv } });
    }
    case 'apply': {
      ok(room.phase === 'elim' && s.stage === 'reveal' && s.rv, 'Étape invalide');
      const rv = s.rv!;
      const plan = (await getSecrets(room.id)).elim!;
      const isCard = rv.kind === 'card';
      const targets = isCard ? (rv.card?.target ? [rv.card.target] : []) : rv.outcome?.targets ?? [];
      ok(isCard ? !!rv.card?.target : !!rv.outcome, 'Dépouillement non terminé');

      if (isCard && plan.kind === 'card')
        for (const pid of plan.consumedBy) must(await db().from('player_private').update({ card_used: true }).eq('player_id', pid));
      if (targets.length) must(await db().from('marathons').update({ status: 'out' }).in('id', targets));

      const alive = (s.alive ?? []).filter((id) => !targets.includes(id));
      const out = [...(s.out ?? []), ...targets.map((id) => ({ id, round: room.round, how: (isCard ? 'card' : 'vote') as 'card' | 'vote' }))];
      const toFinal = alive.length <= 3 || (rv.outcome?.kind === 'stay' && !!rv.outcome.toFinal);
      return putRoom(room.id, {
        phase: toFinal ? 'final' : 'elim',
        round: toFinal ? room.round : room.round + 1,
        state: { stage: 'lobby', alive, out, voted: [], timer: null },
      });
    }

    /* ---------- finale ---------- */
    case 'final-start': {
      ok(room.phase === 'final' && s.stage === 'voting', 'Étape invalide');
      const ids = await allVoted(room);
      const bs = await ballots(room.id, 'final', room.round);
      const priv = await db().from('player_private').select('player_id,card_used').in('player_id', ids);
      const allocs: Record<string, Record<string, number>> = {};
      bs.forEach((x) => (allocs[x.player_id] = x.payload.alloc as Record<string, number>));
      const cards: Record<string, boolean> = {};
      (priv.data ?? []).forEach((p) => (cards[p.player_id as string] = p.card_used as boolean));
      const order = shuffle(ids);
      await putSecrets(room.id, { ...(await getSecrets(room.id)), final: { order, allocs, cards } });
      return putRoom(room.id, { state: { ...s, stage: 'reveal', final: { n: order.length, slips: [] } } });
    }
    case 'final-next': {
      ok(room.phase === 'final' && s.stage === 'reveal' && s.final, 'Étape invalide');
      const sec = (await getSecrets(room.id)).final!;
      const f: FinalState = { ...s.final! };
      ok(f.slips.length < f.n, 'Tous les bulletins sont ouverts');
      const p = sec.order[f.slips.length];
      f.slips = [...f.slips, { p, a: sec.allocs[p], card: sec.cards[p] }];
      if (f.slips.length === f.n) {
        const { totals, top } = finalTotals(s.alive ?? [], f.slips.map((x) => x.a));
        f.totals = totals;
        f.top = top;
      }
      return putRoom(room.id, { state: { ...s, final: f } });
    }
    case 'final-coin': {
      ok(room.phase === 'final' && s.final?.top && s.final.top.length > 1 && !s.final.tieCoin, 'Pas de tirage à faire');
      const cands = s.final!.top!;
      return putRoom(room.id, { state: { ...s, final: { ...s.final!, tieCoin: { cands, winner: pick(cands) } } } });
    }
    case 'set-winner': {
      ok(room.phase === 'final' && s.final?.top, 'Étape invalide');
      const id = String(b.id ?? '');
      const f = s.final!;
      const valid = f.top!.length === 1 ? id === f.top![0] : f.tieCoin ? id === f.tieCoin.winner || f.top!.includes(id) : f.top!.includes(id);
      ok(valid, 'Vainqueur invalide', 400);
      must(await db().from('marathons').update({ status: 'winner' }).eq('id', id));
      return putRoom(room.id, { phase: 'end', state: { ...s, stage: 'lobby', winner: id, timer: null } });
    }

    /* ---------- fin ---------- */
    case 'new-game': {
      const d = db();
      const ids = await playerIds(room.id);
      must(await d.from('ballots').delete().eq('room_id', room.id));
      must(await d.from('room_history').delete().eq('room_id', room.id));
      must(await d.from('room_secrets').upsert({ room_id: room.id, data: {} }));
      if (ids.length) must(await d.from('player_private').update({ card_used: false }).in('player_id', ids));
      must(await d.from('marathons').update({ status: 'pool', qual_count: null }).eq('room_id', room.id));
      return putRoom(room.id, { phase: 'lobby', round: 1, state: { stage: 'lobby', voted: [] } });
    }
    case 'delete-room':
      return must(await db().from('rooms').delete().eq('id', room.id));

    default:
      throw new HttpError(400, 'Action inconnue');
  }
}
