import { auth, body, handle, requireHost } from '@/lib/server';
import { runAction } from '@/lib/game';

/** Toutes les actions de pilotage de la partie (hôte uniquement). */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async () => {
    const { code } = await ctx.params;
    const b = await body<Record<string, unknown>>(req);
    const a = await auth(code, b.playerId, b.token);
    requireHost(a);
    await runAction(a, String(b.type ?? ''), b);
    return { ok: true };
  });
}
