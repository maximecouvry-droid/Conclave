import { db } from '@/lib/supabase-server';
import { HttpError, auth, body, handle, must, requireHost } from '@/lib/server';
import { pushSnapshot } from '@/lib/history';

/** Hôte : ouvre le Conclave (lobby -> qualifs). Le vote devient visible sur les téléphones. */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const b = await body<{ playerId?: string; token?: string }>(req);
    const a = await auth(code, b.playerId, b.token);
    requireHost(a);
    if (a.room.phase !== 'lobby') throw new HttpError(409, 'Déjà ouvert');

    const { count: nm } = await db().from('marathons').select('id', { count: 'exact', head: true }).eq('room_id', a.room.id);
    const { count: np } = await db().from('players').select('id', { count: 'exact', head: true }).eq('room_id', a.room.id);
    if ((nm ?? 0) < 4) throw new HttpError(400, 'Il faut au moins 4 marathons dans la liste');
    if ((np ?? 0) < 3) throw new HttpError(400, 'Il faut au moins 3 joueurs dans la salle');

    await pushSnapshot(a.room.id);
    must(await db().from('rooms').update({ phase: 'qual', round: 1, state: { stage: 'voting', voted: [] } }).eq('id', a.room.id));
    return { ok: true };
  });
}
