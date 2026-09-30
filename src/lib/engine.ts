import 'server-only';
import { randomInt } from 'node:crypto';

/**
 * Moteur de règles, porté à l'identique de la V1. Fonctions PURES côté serveur :
 * tous les tirages au sort sont décidés ici, au dépouillement. L'animation
 * (tambour, dés) n'est que visuelle côté client.
 */

export const NQ = 10; // nombre de qualifiés
export const QUAL_PICKS = 5; // choix par joueur aux qualifs
export const FINAL_CAP = 7; // max de points sur un même marathon
export const FINAL_CAP_CARD = 4; // idem pour qui a joué son carton rouge (5 points)
export const finalCap = (cardUsed: boolean) => (cardUsed ? FINAL_CAP_CARD : FINAL_CAP);

export const rnd = (n: number) => randomInt(n);
export const pick = <T,>(a: T[]): T => a[rnd(a.length)];
export function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* ---------- 1. Qualifs ---------- */

export const qualPickCount = (nMarathons: number) => Math.min(QUAL_PICKS, nMarathons);

export interface QualPlan {
  /** qualifiés, du 1er au dernier */
  ranked: string[];
  counts: Record<string, number>;
  /** égalité à la limite : tirage au sort place par place (du dernier au 1er) */
  coin: { cands: string[]; spots: number; cut: number } | null;
  /** cités mais non qualifiés */
  dropped: string[];
}

export function computeQual(marathonIds: string[], picks: string[][]): QualPlan {
  const counts: Record<string, number> = {};
  marathonIds.forEach((id) => (counts[id] = 0));
  picks.forEach((b) => b.forEach((id) => counts[id]++));

  const n = Math.min(NQ, marathonIds.length);
  const sorted = shuffle(marathonIds).sort((a, b) => counts[b] - counts[a]);
  const cut = counts[sorted[n - 1]];
  const above = sorted.filter((id) => counts[id] > cut);
  const tied = sorted.filter((id) => counts[id] === cut);
  const spots = n - above.length;
  const ranked = above.concat(tied.slice(0, spots));
  return {
    ranked,
    counts,
    coin: tied.length > spots ? { cands: tied, spots, cut } : null,
    dropped: sorted.filter((id) => !ranked.includes(id) && counts[id] > 0),
  };
}

/* ---------- 3. Éliminations ---------- */

export interface ElimBallot {
  playerId: string;
  type: 'vote' | 'card';
  target: string;
}

export type ElimPlan =
  | { kind: 'card'; targets: string[]; coin: string[] | null; consumedBy: string[]; returned: number }
  | { kind: 'vote'; targets: string[]; order: string[] }
  | { kind: 'multi'; targets: string[]; order: string[] }
  | { kind: 'stay'; targets: []; tied: string[]; order: string[]; toFinal: boolean };

export function resolveElim(alive: string[], ballots: ElimBallot[]): ElimPlan {
  const cards = ballots.filter((b) => b.type === 'card');
  if (cards.length) {
    const targets = [...new Set(cards.map((c) => c.target))];
    const target = targets.length > 1 ? pick(targets) : targets[0];
    return {
      kind: 'card',
      targets: [target],
      coin: targets.length > 1 ? targets : null,
      // plusieurs cartons sur le même marathon : tous consommés ; les autres sont rendus
      consumedBy: cards.filter((c) => c.target === target).map((c) => c.playerId),
      returned: cards.filter((c) => c.target !== target).length,
    };
  }
  const tally: Record<string, number> = {};
  alive.forEach((id) => (tally[id] = 0));
  ballots.forEach((b) => tally[b.target]++);
  const max = Math.max(...Object.values(tally));
  const tied = alive.filter((id) => tally[id] === max);
  const order = shuffle(ballots.map((b) => b.target)); // ordre d'ouverture des bulletins
  if (tied.length === 1) return { kind: 'vote', targets: tied, order };
  // égalité : tous sortent s'il en reste >= 3, sinon personne ; à 4 restants -> finale à 4
  if (alive.length - tied.length >= 3) return { kind: 'multi', targets: tied, order };
  return { kind: 'stay', targets: [], tied, order, toFinal: alive.length <= 4 };
}

/* ---------- 4. Finale ---------- */

export const finalBudget = (cardUsed: boolean) => (cardUsed ? 5 : 10);

export function validFinalAlloc(alloc: unknown, alive: string[], cardUsed: boolean): Record<string, number> | null {
  if (!alloc || typeof alloc !== 'object') return null;
  const budget = finalBudget(cardUsed);
  const cap = finalCap(cardUsed);
  const out: Record<string, number> = {};
  let sum = 0;
  for (const id of alive) {
    const v = (alloc as Record<string, unknown>)[id] ?? 0;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > cap) return null;
    out[id] = v;
    sum += v;
  }
  return sum === budget ? out : null;
}

export function finalTotals(alive: string[], allocs: Record<string, number>[]) {
  const totals: Record<string, number> = {};
  alive.forEach((id) => (totals[id] = 0));
  allocs.forEach((a) => Object.entries(a).forEach(([id, v]) => id in totals && (totals[id] += v)));
  const max = Math.max(...Object.values(totals));
  return { totals, top: alive.filter((id) => totals[id] === max) };
}
