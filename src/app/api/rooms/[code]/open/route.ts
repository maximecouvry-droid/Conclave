import { db } from '@/lib/supabase-server';
import { HttpError, auth, body, handle, must, requireHost } from '@/lib/server';
import { pushSnapshot } from '@/lib/history';

/**
 * Hôte : ouvre le Conclave (lobby -> qualifs).
 * Les marathons de la salle sont ceux du catalogue (table « catalog », fixée en amont).
 */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const b = await body<{ playerId?: string; token?: string }>(req);
    const a = await auth(code, b.playerId, b.token);
    requireHost(a);
    if (a.room.phase !== 'lobby') throw new HttpError(409, 'Déjà ouvert');

    const cat = await db().from('catalog').select('slug,name').order('position');
    if (cat.error) throw new HttpError(500, cat.error.message);
    const { count: np } = await db().from('players').select('id', { count: 'exact', head: true }).eq('room_id', a.room.id);
    if ((cat.data?.length ?? 0) < 4) throw new HttpError(400, 'Le catalogue de marathons est vide ou trop court');
    if ((np ?? 0) < 3) throw new HttpError(400, 'Il faut au moins 3 joueurs dans le conclave');

    await pushSnapshot(a.room.id);
    must(await db().from('marathons').delete().eq('room_id', a.room.id));
    must(await db().from('marathons').insert(
      cat.data!.map((m, i) => ({ room_id: a.room.id, position: i, name: m.name, info: '', slug: m.slug, status: 'pool' })),
    ));
    must(await db().from('rooms').update({ phase: 'qual', round: 1, state: { stage: 'voting', voted: [] } }).eq('id', a.room.id));
    return { ok: true };
  });
}
