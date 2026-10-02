import { db } from '@/lib/supabase-server';
import { HttpError, body, handle, must } from '@/lib/server';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1

const newCode = () => Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

/** Crée une salle ; l'hôte est aussi un joueur. */
export async function POST(req: Request) {
  return handle(async () => {
    const { name } = await body<{ name?: string }>(req);
    const hostName = String(name ?? '').trim().slice(0, 20);
    if (!hostName) throw new HttpError(400, 'Il faut un pseudo');

    let room: { id: string; code: string } | null = null;
    for (let i = 0; i < 5 && !room; i++) {
      const r = await db().from('rooms').insert({ code: newCode(), state: { stage: 'lobby', voted: [] } }).select('id,code').maybeSingle();
      if (r.data) room = r.data;
    }
    if (!room) throw new HttpError(500, 'Impossible de créer le conclave');

    const p = await db().from('players').insert({ room_id: room.id, name: hostName }).select('id').single();
    if (p.error) throw new HttpError(500, p.error.message);
    const priv = await db().from('player_private').insert({ player_id: p.data.id }).select('token').single();
    if (priv.error) throw new HttpError(500, priv.error.message);

    must(await db().from('rooms').update({ host_player_id: p.data.id }).eq('id', room.id));
    must(await db().from('room_secrets').insert({ room_id: room.id }));
    return { code: room.code, playerId: p.data.id, token: priv.data.token };
  });
}
