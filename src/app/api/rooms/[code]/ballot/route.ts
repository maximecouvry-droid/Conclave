import { db } from '@/lib/supabase-server';
import { HttpError, auth, body, handle, must } from '@/lib/server';
import { pushSnapshot } from '@/lib/history';
import { qualPickCount, validFinalAlloc } from '@/lib/engine';

/**
 * Un joueur rend (ou modifie, tant que rien n'est révélé) son bulletin secret.
 * Le serveur valide tout : le client n'est jamais cru sur parole.
 * Publie seulement « qui a voté » dans rooms.state.voted (jamais le contenu).
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const b = await body<{ playerId?: string; token?: string; type?: string; payload?: Record<string, unknown> }>(req);
    const a = await auth(code, b.playerId, b.token);
    const { room } = a;
    if (room.state.stage !== 'voting') throw new HttpError(409, "Le vote n'est pas ouvert");

    const d = db();
    const alive = async () => {
      const q = d.from('marathons').select('id').eq('room_id', room.id);
      const r = room.phase === 'qual' ? await q : await q.eq('status', 'alive');
      return (r.data ?? []).map((m) => m.id as string);
    };
    let type: 'qual' | 'vote' | 'card' | 'final';
    let payload: Record<string, unknown>;

    if (room.phase === 'qual' && b.type === 'qual') {
      const ids = await alive();
      const picks = b.payload?.picks;
      if (!Array.isArray(picks) || new Set(picks).size !== picks.length || picks.length !== qualPickCount(ids.length) || !picks.every((p) => ids.includes(p as string)))
        throw new HttpError(400, 'Choix invalides');
      type = 'qual';
      payload = { picks };
    } else if (room.phase === 'elim' && (b.type === 'vote' || b.type === 'card')) {
      const target = b.payload?.target;
      if (typeof target !== 'string' || !(await alive()).includes(target)) throw new HttpError(400, 'Choix invalide');
      if (b.type === 'card' && a.cardUsed) throw new HttpError(409, 'Carton rouge déjà joué');
      type = b.type;
      payload = { target };
    } else if (room.phase === 'final' && b.type === 'final') {
      const alloc = validFinalAlloc(b.payload?.alloc, await alive(), a.cardUsed);
      if (!alloc) throw new HttpError(400, 'Répartition invalide');
      type = 'final';
      payload = { alloc };
    } else {
      throw new HttpError(409, 'Bulletin non attendu à cette étape');
    }

    await pushSnapshot(room.id);
    must(await d.from('ballots').upsert(
      { room_id: room.id, player_id: a.player.id, phase: room.phase, round: room.round, type, payload },
      { onConflict: 'room_id,player_id,phase,round' },
    ));
    // « qui a voté » est recalculé depuis les bulletins (source de vérité) et revérifié :
    // deux votes simultanés ne peuvent donc plus s'écraser.
    for (let i = 0; i < 4; i++) {
      const rows = await d.from('ballots').select('player_id').eq('room_id', room.id).eq('phase', room.phase).eq('round', room.round);
      const voted = (rows.data ?? []).map((r) => r.player_id as string);
      const fresh = await d.from('rooms').select('state').eq('id', room.id).single();
      const cur = (fresh.data?.state ?? {}) as Record<string, unknown>;
      const same = Array.isArray(cur.voted) && cur.voted.length === voted.length && voted.every((v) => (cur.voted as string[]).includes(v));
      if (same) break;
      must(await d.from('rooms').update({ state: { ...cur, voted } }).eq('id', room.id));
    }
    return { ok: true };
  });
}
