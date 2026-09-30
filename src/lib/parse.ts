/** Format V1 : une ligne par marathon, « Ville ; critère ; critère ». */
export function parseList(text: string): { name: string; info: string }[] {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split(';').map((s) => s.trim()).filter(Boolean);
      return { name: (parts[0] || '').slice(0, 60), info: parts.slice(1).join(', ').slice(0, 120) };
    })
    .filter((m) => m.name);
}

export const EXAMPLE = `Lisbonne ; octobre
Porto ; novembre
Séville ; février
Valence ; décembre
Barcelone ; mars
Malaga ; décembre
Rome ; mars
Florence ; novembre
Berlin ; septembre
Amsterdam ; octobre
Prague ; mai
Budapest ; automne
Vienne ; avril
Copenhague ; mai
Dublin ; octobre
Madère ; janvier
Malte ; février
Nice-Cannes ; novembre
Ljubljana ; octobre`;
