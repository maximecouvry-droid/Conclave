import { db } from '@/lib/supabase-server';
import { auth, body, handle } from '@/lib/server';
import type { Me } from '@/lib/types';

/** Infos privées d'UN joueur, sur lui seul : son bulletin en cours, son carton. */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  return handle(async (): Promise<Me> => {
    const { code } = await ctx.params;
    const b = await body<{ playerId?: string; token?: string }>(req);
    const a = await auth(code, b.playerId, b.token);

    const ballot = await db()
      .from('ballots')
      .select('type,payload')
      .eq('room_id', a.room.id)
      .eq('player_id', a.player.id)
      .eq('phase', a.room.phase)
      .eq('round', a.room.round)
      .maybeSingle();

    return { isHost: a.isHost, cardAvailable: !a.cardUsed, myBallot: (ballot.data as Me['myBallot']) ?? null };
  });
}
