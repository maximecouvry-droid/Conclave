// Colonnes « Météo » et « Avis météo » de la base Notion « Choix marathon » (copie).
// slug -> [Météo, Avis météo]. Format de « Météo » (identique sur toutes les lignes) :
//   "<année> (<source>) : max X° / min Y° · pluie Z mm (dont W le jour J) · vent max V km/h"
// où <source> = « réel, J-1/J/J+1 » (mesuré autour de la course 2026) ou « même date, an dernier » (archive 2025).
export const WEATHER = {
  anvers: ['2025 (même date, an dernier) : max 14,5° / min 8,9° · pluie 2,3 mm (dont 0 le jour J) · vent max 12 km/h', 'Mi-octobre : ~8-15°C, températures idéales pour courir. Climat belge : pluie et vent assez fréquents, mais parcours plat et peu exposé.'],
  bucarest: ['2026 (réel, J-1/J/J+1) : max 23,9° / min 13,5° · pluie 17,3 mm (dont 0 le jour J) · vent max 15 km/h', "Début octobre en général sec et doux (~8-19°C). 2026 était nettement plus chaud que la normale. Risque de chaleur si l'automne reste doux."],
  budapest: ['2026 (réel, J-1/J/J+1) : max 17,4° / min 9,5° · pluie 14,6 mm (dont 6,4 le jour J) · vent max 13 km/h', 'Mi-octobre souvent clément : ~8-18°C, assez sec et ensoleillé en général. Bonnes conditions, quelques averses possibles.'],
  catane: ['2025 (même date, an dernier) : max 17,4° / min 10,3° · pluie 0 mm · vent max 8 km/h', 'Hiver doux sur la côte sicilienne : 10-17°C en général, bon pour courir. Décembre reste la saison humide : averses possibles, rarement du froid. Risque principal = pluie/vent.'],
  cologne: ['2026 (réel, J-1/J/J+1) : max 20,7° / min 9,9° · pluie 0 mm · vent max 7 km/h', 'Début octobre : normalement ~8-16°C, bien pour courir. 2026 était exceptionnellement doux (~21°C). Pluie possible, sinon conditions plutôt favorables.'],
  dublin: ['2025 (même date, an dernier) : max 11,2° / min 6,2° · pluie 4,2 mm (dont 0,3 le jour J) · vent max 29 km/h', 'Fin octobre : ~6-12°C, bonne température mais très variable. Pluie fréquente et vent notable, parfois fort. Prévoir plusieurs tenues.'],
  florence: ['2025 (même date, an dernier) : max 11,1° / min 0,2° · pluie 0 mm · vent max 12 km/h', "Fin novembre frais : ~3-12°C, départ souvent froid et brumeux. Novembre est le mois le plus pluvieux de l'année en Toscane : pluie fréquente, mais températures correctes pour un marathon."],
  'la-rochelle': ['2025 (même date, an dernier) : max 12,7° / min 8,5° · pluie 37,5 mm (dont 19,1 le jour J) · vent max 24 km/h', 'Fin novembre océanique : ~4-11°C, humide et venteux, pluie fréquente. Températures correctes mais vent de bord de mer possible. Prévoir une tenue coupe-vent.'],
  ljubljana: ['2025 (même date, an dernier) : max 14,7° / min 3,0° · pluie 0 mm · vent max 8 km/h', 'Mi-octobre : ~5-15°C, matins frais voire brumeux, après-midis agréables. Bonnes conditions pour un marathon ; la pluie reste possible mais peu de vent.'],
  'loch-ness': ['2026 (réel, J-1/J/J+1) : max 14,8° / min 9,2° · pluie 5,2 mm (dont 4,2 le jour J) · vent max 21 km/h', 'Fraîcheur idéale (~8-15°C) mais Highlands très changeants : averses fréquentes et vent possibles, y compris de face sur le bord du loch. Prévoir une tenue pluie.'],
  malaga: ['2025 (même date, an dernier) : max 21,9° / min 14,2° · pluie 0 mm · vent max 19 km/h', 'Début novembre doux et ensoleillé : ~14-22°C, pluie rare. Peut être chaud en fin de course si le départ est tardif, sinon très bon créneau.'],
  munich: ['2026 (réel, J-1/J/J+1) : max 13,1° / min 7,5° · pluie 7,0 mm (dont 0,1 le jour J) · vent max 14 km/h', 'Mi-octobre frais : ~5-14°C, températures idéales. Souvent sec avec brume matinale, parfois pluie. Très bon créneau pour un marathon.'],
  'nice-cannes': ['2025 (même date, an dernier) : max 16,5° / min 9,9° · pluie 14,2 mm (dont 0 le jour J) · vent max 14 km/h', 'Début novembre doux : ~11-18°C. Mais c\'est la saison des épisodes méditerranéens pluvieux ou orageux sur la Côte d\'Azur : risque réel de pluie forte et de vent.'],
  oslo: ['2026 (réel, J-1/J/J+1) : max 16,0° / min 10,4° · pluie 4,7 mm (dont 1,4 le jour J) · vent max 14 km/h', 'Mi-septembre : ~10-17°C, conditions de course quasi idéales. Les averses restent fréquentes en Norvège du Sud, mais rarement très fortes.'],
  palerme: ['2025 (même date, an dernier) : max 23,5° / min 15,1° · pluie 0 mm · vent max 8 km/h', 'Mi-novembre doux : ~14-22°C, souvent ensoleillé. La pluie devient plus fréquente à cette période. Peut être chaud pour courir, sinon très bon créneau.'],
  parme: ['2025 (même date, an dernier) : max 18,2° / min 7,3° · pluie 0 mm · vent max 8 km/h', "Mi-octobre : ~8-19°C, bonnes températures. Brouillard matinal fréquent dans la plaine du Pô, pluie d'automne possible. Plutôt favorable."],
  porto: ['2025 (même date, an dernier) : max 17,2° / min 10,3° · pluie 27,7 mm (dont 0 le jour J) · vent max 15 km/h', 'Températures idéales (~11-17°C) mais début de saison pluvieuse : pluie fréquente début novembre, avec du vent côté Atlantique. Prévoir une option pluie.'],
  sofia: ['2026 (réel, J-1/J/J+1) : max 21,6° / min 11,9° · pluie 15,8 mm (dont 12,4 le jour J) · vent max 14 km/h', 'Mi-octobre : normalement ~6-18°C, plutôt sec et ensoleillé, matins frais. Bon créneau ; 2026 a été plus chaud et pluvieux que la normale.'],
  tirana: ['2025 (même date, an dernier) : max 20,8° / min 13,1° · pluie 83,4 mm (dont 1,1 le jour J) · vent max 18 km/h', 'Fin octobre doux (~14-22°C) mais début de saison des pluies : orages et épisodes de forte pluie possibles. Chaleur modérée le jour, humidité élevée.'],
  turin: ['2025 (même date, an dernier) : max 8,0° / min -2,1° · pluie 0 mm · vent max 4 km/h', "Fin novembre froid : ~0-9°C, gelées matinales possibles et brouillard de la plaine du Pô. Plutôt sec, peu de vent ; départ très frais, à bien s'habiller."],
  varsovie: ['2026 (réel, J-1/J/J+1) : max 18,7° / min 9,1° · pluie 0,8 mm (dont 0 le jour J) · vent max 10 km/h', "Fin septembre : ~8-18°C, conditions agréables pour courir. Plutôt sec, début d'automne ; fraîcheur le matin."],
  zagreb: ['2026 (réel, J-1/J/J+1) : max 14,5° / min 9,6° · pluie 23,1 mm (dont 2,1 le jour J) · vent max 8 km/h', 'Automne doux : ~8-17°C, températures idéales. Mais octobre est souvent humide avec brouillard le matin ; pluie possible sans être systématique.'],
};

const num = (s) => Number(String(s).replace(',', '.'));

/** « Météo » (texte uniforme) -> champs structurés. Lève une erreur si une ligne sort du format. */
export function parseMeteo(slug, s) {
  const m = s.match(/^(\d{4}) \(([^)]*)\) : max (-?[\d,]+)° \/ min (-?[\d,]+)° · pluie ([\d,]+) mm(?: \(dont ([\d,]+) le jour J\))? · vent max (\d+) km\/h$/);
  if (!m) throw new Error(`Format météo inattendu pour ${slug} : ${s}`);
  return {
    weather_year: Number(m[1]),
    weather_kind: /réel/.test(m[2]) ? 'observed' : 'last_year',
    temp_max: num(m[3]),
    temp_min: num(m[4]),
    rain_mm: num(m[5]),
    rain_day_mm: m[6] ? num(m[6]) : 0, // la parenthèse est absente quand il n'a pas plu du tout
    wind_kmh: num(m[7]),
  };
}
