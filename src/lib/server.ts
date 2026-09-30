import 'server-only';
import { NextResponse } from 'next/server';
import { db } from './supabase-server';
import type { Room } from './types';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Enveloppe commune des routes : JSON en sortie, erreurs propres. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn());
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Requête invalide');
  }
}

export function ensure<T>(res: { data: T | null; error: { message: string } | null }, status = 500, msg?: string): T {
  if (res.error || res.data === null) throw new HttpError(status, msg ?? res.error?.message ?? 'Introuvable');
  return res.data;
}

export function must(res: { error: { message: string } | null }) {
  if (res.error) throw new HttpError(500, res.error.message);
}

export interface Authed {
  room: Room;
  player: { id: string; name: string };
  cardUsed: boolean;
  isHost: boolean;
}

/** Vérifie (code de salle, playerId, token) et renvoie le contexte du joueur. */
export async function auth(code: string, playerId: unknown, token: unknown): Promise<Authed> {
  if (typeof playerId !== 'string' || typeof token !== 'string') throw new HttpError(401, 'Non identifié');
  const roomRes = await db().from('rooms').select('*').eq('code', code.toUpperCase()).maybeSingle();
  const room = ensure(roomRes as { data: Room | null; error: { message: string } | null }, 404, 'Salle introuvable');

  const p = await db().from('players').select('id,name,room_id').eq('id', playerId).eq('room_id', room.id).maybeSingle();
  const player = ensure(p as { data: { id: string; name: string } | null; error: { message: string } | null }, 401, 'Joueur inconnu');
  const priv = await db().from('player_private').select('token,card_used').eq('player_id', playerId).maybeSingle();
  const pv = ensure(priv as { data: { token: string; card_used: boolean } | null; error: { message: string } | null }, 401, 'Joueur inconnu');
  if (pv.token !== token) throw new HttpError(401, 'Session invalide');

  return { room, player, cardUsed: pv.card_used, isHost: room.host_player_id === player.id };
}

export function requireHost(a: Authed) {
  if (!a.isHost) throw new HttpError(403, "Réservé à l'hôte");
}
