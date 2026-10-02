import { db } from '@/lib/supabase-server';
import { HttpError, body, ensure, handle } from '@/lib/server';

const MAX_PLAYERS = 8;

export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const { name } = await body<{ name?: string }>(req);
    const pseudo = String(name ?? '').trim().slice(0, 20);
    if (!pseudo) throw new HttpError(400, 'Il faut un pseudo');

    const room = ensure<{ id: string; phase: string }>(
      await db().from('rooms').select('id,phase').eq('code', code.toUpperCase()).maybeSingle(),
      404,
      'Conclave introuvable',
    );
    if (room.phase !== 'lobby') throw new HttpError(409, 'Ce conclave a déjà commencé');

    const { count } = await db().from('players').select('id', { count: 'exact', head: true }).eq('room_id', room.id);
    if ((count ?? 0) >= MAX_PLAYERS) throw new HttpError(409, 'Conclave complet');

    const p = await db().from('players').insert({ room_id: room.id, name: pseudo }).select('id').single();
    if (p.error) throw new HttpError(p.error.code === '23505' ? 409 : 500, p.error.code === '23505' ? 'Ce pseudo est déjà pris' : p.error.message);
    const priv = await db().from('player_private').insert({ player_id: p.data.id }).select('token').single();
    if (priv.error) throw new HttpError(500, priv.error.message);
    return { playerId: p.data.id, token: priv.data.token };
  });
}
