import { db } from '@/lib/supabase-server';
import { HttpError, auth, body, handle, must, requireHost } from '@/lib/server';
import { pushSnapshot } from '@/lib/history';
import { parseList } from '@/lib/parse';

/** Hôte : remplace la liste des marathons (avant l'ouverture du Conclave). */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const b = await body<{ playerId?: string; token?: string; text?: string }>(req);
    const a = await auth(code, b.playerId, b.token);
    requireHost(a);
    if (a.room.phase !== 'lobby') throw new HttpError(409, 'Le Conclave est ouvert : la liste est figée');

    const list = parseList(b.text ?? '');
    if (list.length > 60) throw new HttpError(400, '60 marathons maximum');

    await pushSnapshot(a.room.id);
    must(await db().from('marathons').delete().eq('room_id', a.room.id));
    if (list.length) {
      must(await db().from('marathons').insert(list.map((m, i) => ({ room_id: a.room.id, position: i, name: m.name, info: m.info }))));
    }
    return { count: list.length };
  });
}
