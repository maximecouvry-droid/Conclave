'use client';

export interface Creds {
  playerId: string;
  token: string;
}

const key = (code: string) => `mdm:${code.toUpperCase()}`;

export function loadCreds(code: string): Creds | null {
  try {
    const raw = localStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as Creds) : null;
  } catch {
    return null;
  }
}
export function saveCreds(code: string, c: Creds) {
  try {
    localStorage.setItem(key(code), JSON.stringify(c));
  } catch {}
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
