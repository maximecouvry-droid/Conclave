import 'server-only';
import { db } from './supabase-server';
import { HttpError, must } from './server';

const MAX_HISTORY = 80;

/**
 * Photographie complète de la salle (publique + secrète) AVANT une action.
 * Appeler pushSnapshot() en tête de chaque route qui modifie la salle.
 */
export async function pushSnapshot(roomId: string) {
  const d = db();
  const [room, secrets, ballots, marathons, players] = await Promise.all([
    d.from('rooms').select('phase,round,state').eq('id', roomId).single(),
    d.from('room_secrets').select('data').eq('room_id', roomId).maybeSingle(),
    d.from('ballots').select('*').eq('room_id', roomId),
    d.from('marathons').select('*').eq('room_id', roomId),
    d.from('players').select('id').eq('room_id', roomId),
  ]);
  const ids = (players.data ?? []).map((p) => p.id);
  const cards = ids.length ? await d.from('player_private').select('player_id,card_used').in('player_id', ids) : { data: [] };

  must(await d.from('room_history').insert({
    room_id: roomId,
    snapshot: {
      room: room.data,
      secrets: secrets.data?.data ?? {},
      ballots: ballots.data ?? [],
      marathons: marathons.data ?? [],
      cards: cards.data ?? [],
    },
  }));

  const old = await d.from('room_history').select('id').eq('room_id', roomId).order('id', { ascending: false }).range(MAX_HISTORY, MAX_HISTORY + 200);
  if (old.data?.length) await d.from('room_history').delete().in('id', old.data.map((r) => r.id));
}

/** Restaure la dernière photographie et la retire de la pile. */
export async function undoLast(roomId: string) {
  const d = db();
  const h = await d.from('room_history').select('id,snapshot').eq('room_id', roomId).order('id', { ascending: false }).limit(1).maybeSingle();
  if (!h.data) throw new HttpError(409, 'Rien à annuler');
  const s = h.data.snapshot as {
    room: { phase: string; round: number; state: unknown };
    secrets: unknown;
    ballots: Record<string, unknown>[];
    marathons: Record<string, unknown>[];
    cards: { player_id: string; card_used: boolean }[];
  };

  must(await d.from('ballots').delete().eq('room_id', roomId));
  if (s.ballots.length) must(await d.from('ballots').insert(s.ballots));
  must(await d.from('marathons').delete().eq('room_id', roomId));
  if (s.marathons.length) must(await d.from('marathons').insert(s.marathons));
  must(await d.from('room_secrets').upsert({ room_id: roomId, data: s.secrets }));
  for (const c of s.cards) must(await d.from('player_private').update({ card_used: c.card_used }).eq('player_id', c.player_id));
  // la salle en dernier : c'est ce changement qui réveille les écrans en Realtime
  must(await d.from('rooms').update(s.room).eq('id', roomId));
  must(await d.from('room_history').delete().eq('id', h.data.id));
}
