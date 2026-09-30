import { auth, body, handle, requireHost } from '@/lib/server';
import { undoLast } from '@/lib/history';

/** Hôte : « Annuler la dernière action » (restaure la photographie précédente). */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const b = await body<{ playerId?: string; token?: string }>(req);
    const a = await auth(code, b.playerId, b.token);
    requireHost(a);
    await undoLast(a.room.id);
    return { ok: true };
  });
}
