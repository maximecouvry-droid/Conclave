import type { CatalogMarathon } from './catalog';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function fmtDate(d: string | null, long = false): string {
  if (!d) return '?';
  const [y, m, day] = d.split('-').map(Number);
  if (!long) return `${day} ${MONTHS[m - 1]}`;
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function fmtLoops(l: string | null): string {
  if (!l) return '?';
  if (/^\d+$/.test(l)) return l === '1' ? '1 boucle' : `${l} boucles`;
  return l;
}

export function fmtElevation(e: string | null): string {
  if (!e) return '?';
  return /^\d+$/.test(e) ? `${e} m D+` : e;
}

export const fmtParticipants = (n: number | null) => (n == null ? '?' : n.toLocaleString('fr-FR'));

/** Les 4 infos affichées sur chaque bloc marathon. */
export function stats(m: CatalogMarathon) {
  return [
    { k: 'Date', icon: '📅', v: fmtDate(m.date) },
    { k: 'Boucles', icon: '🔁', v: fmtLoops(m.loops) },
    { k: 'D+', icon: '⛰️', v: fmtElevation(m.elevation) },
    { k: 'Participants', icon: '👥', v: fmtParticipants(m.participants) },
  ];
}

const dec = (n: number, digits = 1) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? digits : 0, maximumFractionDigits: digits });
export const fmtTemp = (n: number | null) => (n == null ? '?' : `${dec(n)}°`);
export const fmtMm = (n: number | null) => (n == null ? '?' : `${dec(n)} mm`);
export const fmtWind = (n: number | null) => (n == null ? '?' : `${dec(n, 0)} km/h`);

/** D'où vient la mesure météo (« observed » = autour de la course 2026, sinon même date l'an dernier). */
export function weatherSource(m: Pick<CatalogMarathon, 'weather_kind' | 'weather_year'>): string {
  if (!m.weather_year) return '';
  return m.weather_kind === 'observed'
    ? `Relevé réel ${m.weather_year} · veille, jour de course et lendemain`
    : `Même date en ${m.weather_year} (l'an dernier)`;
}
