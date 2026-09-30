'use client';

/** Notes et ranking perso : stockés uniquement dans le navigateur de l'utilisateur. */
export interface PersonalNote {
  note: string;
  rank: number; // 0 = pas de note, 1 à 5 étoiles
}

const key = (slug: string) => `mdm-notes:${slug}`;

export function loadNote(slug: string): PersonalNote {
  try {
    const r = JSON.parse(localStorage.getItem(key(slug)) || 'null');
    if (r) return { note: String(r.note ?? ''), rank: Number(r.rank) || 0 };
  } catch {}
  return { note: '', rank: 0 };
}

export function saveNote(slug: string, n: PersonalNote) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(n));
  } catch {}
}

/** Notes de plusieurs marathons d'un coup (pour trier la liste). */
export function loadRanks(slugs: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  slugs.forEach((s) => (out[s] = loadNote(s).rank));
  return out;
}
