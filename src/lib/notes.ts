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

/* ---------- Transfert d'un appareil à l'autre (lien avec les notes dans le #fragment) ---------- */

export type NotesExport = Record<string, PersonalNote>;

/** Toutes les notes / étoiles saisies sur cet appareil (les marathons sans rien sont ignorés). */
export function exportNotes(slugs: string[]): NotesExport {
  const out: NotesExport = {};
  slugs.forEach((s) => {
    const n = loadNote(s);
    if (n.note.trim() || n.rank) out[s] = n;
  });
  return out;
}

const b64 = {
  enc: (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))),
};

export const encodeNotes = (n: NotesExport) => b64.enc(JSON.stringify(n));

export function decodeNotes(code: string): NotesExport | null {
  try {
    const raw = JSON.parse(b64.dec(code));
    if (!raw || typeof raw !== 'object') return null;
    const out: NotesExport = {};
    for (const [slug, v] of Object.entries(raw as Record<string, { note?: unknown; rank?: unknown }>)) {
      if (!/^[a-z0-9-]{1,40}$/.test(slug)) continue;
      out[slug] = { note: String(v?.note ?? '').slice(0, 5000), rank: Math.max(0, Math.min(5, Number(v?.rank) || 0)) };
    }
    return out;
  } catch {
    return null;
  }
}

/** Fusionne : la note reçue remplace la locale pour chaque marathon présent dans le lien. */
export function importNotes(n: NotesExport) {
  Object.entries(n).forEach(([slug, v]) => saveNote(slug, v));
}
