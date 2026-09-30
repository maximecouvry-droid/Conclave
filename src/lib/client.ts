'use client';

export interface Creds {
  playerId: string;
  token: string;
}

const key = (code: string) => `mdm:${code.toUpperCase()}`;
const CUR = 'mdm-current';

export function loadCreds(code: string): Creds | null {
  try {
    const raw = localStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as Creds) : null;
  } catch {
    return null;
  }
}
/** Enregistre l'identité ET mémorise « la salle où je suis » (on y revient automatiquement). */
export function saveCreds(code: string, c: Creds) {
  try {
    localStorage.setItem(key(code), JSON.stringify(c));
    localStorage.setItem(CUR, code.toUpperCase());
  } catch {}
}
/** Quitte une salle : oublie l'identité et la salle courante. */
export function forgetRoom(code: string) {
  try {
    localStorage.removeItem(key(code));
    if (localStorage.getItem(CUR) === code.toUpperCase()) localStorage.removeItem(CUR);
  } catch {}
}
/** Salle à rouvrir : la courante, sinon n'importe quelle salle dont on a encore l'identité. */
export function currentRoom(): string | null {
  try {
    const cur = localStorage.getItem(CUR);
    if (cur && localStorage.getItem(key(cur))) return cur;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mdm:') && k.length === 9) return k.slice(4);
    }
  } catch {}
  return null;
}

/** POST JSON vers une route API ; ajoute l'identité du joueur si fournie. */
export async function api<T = unknown>(path: string, data: Record<string, unknown> = {}, creds?: Creds | null): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...data, ...(creds ?? {}) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Erreur réseau');
  return json as T;
}
