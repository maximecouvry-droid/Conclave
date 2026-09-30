// Construit data/marathons.json à partir de la base Notion « Choix marathon »
// (données copiées ici) + coordonnées + photo de ville récupérée sur Wikipedia.
// Usage : node scripts/build-catalog.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

// [slug, ville, page Wikipedia, lat, lng, date, boucles, D+, semi, participants,
//  image parcours, site officiel, page parcours, depuis Paris, autres courses, source participants]
const ROWS = [
  ['anvers', 'Anvers', 'Antwerp', 51.2194, 4.4025, '2026-10-18', '2', '57', 'Oui même jour', 4100, 'https://antwerpmarathon.com/wp-content/uploads/sites/83/2026/07/G2026_0835_Parcours_v4_Marathon-scaled.png', 'https://antwerpmarathon.com/fr/', 'https://antwerpmarathon.com/fr/le-parcours/', '🚄 Train direct ~2h (Eurostar)', 'Semi et 10 km le même jour (horaires à confirmer)', ''],
  ['bucarest', 'Bucarest', 'Bucharest', 44.4268, 26.1025, '2026-10-11', '1', 'Plat', 'Oui en même temps', 1300, 'https://bucharest-marathon.com/wp-content/uploads/2026/09/42k-scaled.jpg', 'https://bucharest-marathon.com/', 'https://bucharest-marathon.com/bucharest-marathon-maratonul-bucuresti-42km-42k/', '✈️ Vol direct ~3h', 'Semi, 10 km, relais 4×, fun race 2,5 km (10-11 oct., jour et horaire du semi à confirmer)', 'https://bucharest-marathon.com/live-results-bucharest-marathon-2025/'],
  ['budapest', 'Budapest', 'Budapest', 47.4979, 19.0402, '2026-10-11', '1', 'Plat', 'Oui même jour', 4800, 'https://marathon.runinbudapest.com/wp-content/uploads/sites/3/2026/02/SPAR_Budapest_Maraton_Fesztival_2025_42.2km_utvonalterkep.jpg', 'https://marathon.runinbudapest.com/', 'https://marathon.runinbudapest.com/42-km-spar-budapest-marathon/', '✈️ Vol direct ~2h15', 'Dimanche : semi, 30 km, 14 km, relais (horaire semi à confirmer) ; samedi : 10 km, 5 km', 'https://bsieredmenylista.hu/spar-budapest-maraton-2024/39-spar-budapest-maraton/'],
  ['catane', 'Catane', 'Catania', 37.5079, 15.083, '2026-12-13', '4', 'Plat', 'Oui même jour', 145, 'https://wmimg.azureedge.net/public/img/marathons/catania-marathon/route/catania-marathon_1190.jpg?c=1780042308', 'https://www.maratonadicatania.it/', '', '✈️ Vol direct ~2h35', '', 'https://www.endu.net/fr/events/catania-marathon/results?eventId=94627&raceId=57892&categoryId=0&optionId=588678'],
  ['cologne', 'Cologne', 'Cologne', 50.9375, 6.9603, '2026-10-04', '1', '36', 'Oui même jour', 8000, 'https://generali-koeln-marathon.de/wp-content/uploads/2024/10/240919_KoelnMarathon_2025_Strecke_Marathon.svg', 'https://generali-koeln-marathon.de/en/events/marathon/?all-time-best=0', 'https://generali-koeln-marathon.de/en/courses/', '🚄 Train direct ~3h20 (Eurostar)', '', 'https://generali-koeln-marathon.de/en/results/2025-results/#1_6C2959'],
  ['dublin', 'Dublin', 'Dublin', 53.3498, -6.2603, '2026-10-25', '1', '200', 'Non / Week end différent', 18000, 'https://irishlifedublinmarathon.ie/wp-content/uploads/2026/05/route-image-2026.png', 'https://irishlifedublinmarathon.ie/', 'https://irishlifedublinmarathon.ie/course-and-start-finish/', '✈️ Vol direct ~1h30', 'Aucune course plus courte le jour du marathon', 'https://raceresults.dublinmarathon.ie/'],
  ['florence', 'Florence', 'Florence', 43.7696, 11.2558, '2026-11-29', '1', '195', 'Non / Week end différent', 10195, 'https://www.firenzemarathon.it/wp-content/uploads/2025/10/percorso-FM25-2048x863.jpg', 'https://www.firenzemarathon.it/en/marathon/', 'https://www.firenzemarathon.it/en/marathon/', '✈️ Vol direct ~1h50', 'Relais 3×7 km le samedi, 10 km', 'https://www.corrieredellosport.it/news/altri-sport/running/2025/12/22-145415500/classifica_maratone_italiane_19mila_atleti_al_traguardo_roma_prima'],
  ['la-rochelle', 'La Rochelle', 'La Rochelle', 46.1603, -1.1511, '2026-11-29', '1', 'Plat', 'Non / Week end différent', 7400, 'https://marathondelarochelle.com/wp-content/uploads/2026/03/MARATHON-PARCOURS-2026.pdf', 'https://marathondelarochelle.com/', '', '🚄 TGV direct ~3h', '10 km, marathon en duo', 'https://marathondelarochelle.com/wp-content/uploads/2026/03/CLASSEMENT-SCRATCH-SportInnovation_marathon_compressed.pdf'],
  ['ljubljana', 'Ljubljana', 'Ljubljana', 46.0569, 14.5058, '2026-10-18', '1', '159', 'Oui en même temps', 2800, 'https://ljubljanskimaraton.si/upload/gallery/143/music.jpeg', 'https://ljubljanskimaraton.si/en/', 'https://ljubljanskimaraton.si/en/marathon', '✈️ Vol direct ~1h55', '', 'https://ljubljanskimaraton.si/en/results/single?lm=29&cat=42Z'],
  ['loch-ness', 'Loch Ness', 'Loch Ness', 57.32, -4.45, '2026-09-27', 'Point à point', '280', 'Non / Week end différent', 4100, 'https://wmimg.azureedge.net/public/img/marathons/baxters-loch-ness-marathon-festival-of-running/route/baxters-loch-ness-marathon-festival-of-running_1190.jpg?c=1698660289', 'https://lochnessmarathon.com/', 'https://www.caledoniangroupevents.co.uk/loch-ness-marathon/event/loch-ness-marathon', "✈️ Vol direct Édimbourg ~1h45 + 🚆 train ~3h30 jusqu'à Inverness", '10 km et 5 km', 'https://caledoniangroupevents.co.uk/loch-ness-marathon/results/1/2025/'],
  ['malaga', 'Malaga', 'Málaga', 36.7213, -4.4214, '2026-11-08', '1', '117', 'Oui en même temps', 8500, 'https://www.generalimaratonmalaga.com/wp-content/uploads/2025/12/PLANO_RECORRIDO_GMM25_V789.jpg', 'https://www.generalimaratonmalaga.com/', 'https://www.finishers.com/es/evento/maraton-de-malaga', '✈️ Vol direct ~2h30', '', 'https://sportmaniacs.com/es/races/generali-maraton-malaga-2025/69282738-745c-4b73-9108-459cac1f0f0c/rankings'],
  ['munich', 'Munich', 'Munich', 48.1351, 11.582, '2026-10-11', '1', 'Plat', 'Oui même jour', 4000, 'https://marathonmuenchen.org/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2025/03/250303-map-marathon.png.webp', 'https://marathonmuenchen.org/en/', 'https://marathonmuenchen.org/en/the-marathon-one-lap-course-through-munich/', '✈️ Vol direct ~1h30 (ou TGV direct ~5h40)', 'Semi 10h30 (marathon 9h), 10 km 13h30, relais marathon', 'https://muenchen.r.mikatiming.com/2025/?page=161&event=M_2EF3BRLP2&pid=list&pidp=start&search%5Bsex%5D=M&search%5Bage_class%5D=%25'],
  ['nice-cannes', 'Nice-Cannes', 'Nice', 43.7102, 7.262, '2026-11-08', 'Point à point', '150', 'Oui en même temps', 10000, 'https://wmimg.azureedge.net/public/img/marathons/marathon-des-alpes-maritimes-nice-cannes/route/marathon-des-alpes-maritimes-nice-cannes_1190.jpg?c=1653039385', 'https://www.marathon06.com/', '', '✈️ Vol direct ~1h25 (ou TGV direct ~5h40)', '20 km (pas de semi)', 'https://timing4you.com/resultats/G-Live-10.1/g-live.html?f=../2025/Marathon06/Marathon06_2025.clax'],
  ['oslo', 'Oslo', 'Oslo', 59.9139, 10.7522, '2026-09-12', '2', '350', 'Oui même jour', 4200, '', 'https://oslomaraton.no/en/', 'https://oslomaraton.no/en/loypa/', '✈️ Vol direct ~2h', '', 'https://live.ultimate.dk/desktop/front/index.php?eventid=6713&ignoreuseragent=true'],
  ['palerme', 'Palerme', 'Palermo', 38.1157, 13.3615, '2026-11-15', '2', '426', 'Oui en même temps', 438, 'https://www.palermomaratona.it/wp-content/uploads/2025/09/percorso-25-768x545.jpg', 'https://www.palermomaratona.it/', '', '✈️ Vol direct ~2h30', '', 'https://www.palermomaratona.it/edizione-2025/'],
  ['parme', 'Parme', 'Parma', 44.8015, 10.3279, '2026-10-18', '1', '130', 'Non / Week end différent', 389, 'https://www.goandrace.com/path/2023/10/screenshot_20231015_id8138_race1.webp', 'https://www.parmamarathon.it/', 'https://www.parmamarathon.it/percorso-maratona/', '✈️ Vol direct Milan ou Bologne ~1h30 + 🚆 train ~1h', '24 km, 32 km, 10 km', 'https://www.endu.net/fr/events/parma-marathon/results?eventId=94521&raceId=57038&categoryId=0&optionId=579014'],
  ['porto', 'Porto', 'Porto', 41.1579, -8.6291, '2026-11-08', '1', 'Plat', 'Non / Week end différent', 4600, 'https://www.maratonadoporto.com/media/filer_private/2026/09/28/maratona_2026.jpg.695x400_q95_crop_upscale.jpg', 'https://www.maratonadoporto.com/fr/', 'https://www.finishers.com/nl/evenement/marathon-van-porto', '✈️ Vol direct ~2h', '10 km et 6 km', 'https://www.maratonadoporto.com/pt/resultados-2025/'],
  ['sofia', 'Sofia', 'Sofia', 42.6977, 23.3219, '2026-10-11', '2', 'Plat', 'Oui en même temps', 700, 'https://sofiamarathon.bg/wp-content/uploads/2025/06/map_-42_and_21_km_1080_x_566_px.jpg', 'https://sofiamarathon.bg/en/', '', '✈️ Vol direct ~2h50', '5 km et 10 km le samedi', 'https://my4.raceresult.com/366218/results/pdf?name=Result%20Lists%7C01%20-%20Gender%20Results&contest=4&lang=en'],
  ['tirana', 'Tirana', 'Tirana', 41.3275, 19.8187, '2026-10-25', '2', '600', 'Oui en même temps', 145, 'https://wmimg.azureedge.net/public/img/marathons/tirana-marathon/route/tirana-marathon_1190.jpg?c=1755854955', 'https://www.tiranamarathon.com/en', 'https://www.tiranamarathon.com/en/itinerari', '✈️ Vol direct ~2h40', 'Semi et 10 km (horaires à confirmer)', 'https://my.raceresult.com/366805/results#3_0E6344'],
  ['turin', 'Turin', 'Turin', 45.0703, 7.6869, '2026-11-29', '1', '188', 'Oui même jour', 3155, 'https://www.repstatic.it/content/localirep/img/rep-torino/2024/11/30/104327734-622db2af-fde5-496b-a997-4cc5185940bc.jpg?webp', 'https://www.fiatorinocitymarathon.it/en-gb', 'https://www.finishers.com/course/marathon-de-turin', '✈️ Vol direct ~1h25 (ou TGV direct ~5h30)', '', 'https://www.corrieredellosport.it/news/altri-sport/running/2025/12/22-145415500/classifica_maratone_italiane_19mila_atleti_al_traguardo_roma_prima'],
  ['varsovie', 'Varsovie', 'Warsaw', 52.2297, 21.0122, '2026-09-27', '1', '83', 'Non / Week end différent', 9500, 'https://maratonwarszawski.com/wp-content/uploads/2026/08/www_en.jpg', 'https://maratonwarszawski.com/en/', 'https://maratonwarszawski.com/en/news/here-it-is-the-marathon-course/', '✈️ Vol direct ~2h10', 'Semi en mars', 'https://live.sts-timing.pl/mw2025/WynikiMaraton.pdf'],
  ['zagreb', 'Zagreb', 'Zagreb', 45.815, 15.9819, '2026-10-11', '1 × 21 km + 2 × 10 km', '166', 'Oui en même temps', 659, 'https://www.zagreb-marathon.com/wp-content/uploads/nova-staza.jpg', 'https://www.zagreb-marathon.com/en/', '', '✈️ Vol direct ~2h', '', 'https://zagrebmarathon.depar.hr/2025/'],
];

async function cityImage(title) {
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { 'user-agent': 'MarathonApp/1.0 (projet perso)' },
    });
    const j = await r.json();
    const orig = j.originalimage;
    const thumb = j.thumbnail?.source;
    if (!orig && !thumb) return null;
    // Wikimedia n'accepte que certaines largeurs (960 ok) et jamais plus que l'original
    if (orig && orig.width >= 960 && thumb) {
      return thumb.replace(/\/\d+px-/, '/960px-').replace(/\?.*$/, '').replace('thumb.wikimedia.org', 'upload.wikimedia.org');
    }
    return (orig ?? { source: thumb }).source.replace(/\?.*$/, '');
  } catch {
    return null;
  }
}

const out = [];
for (const [slug, name, wiki, lat, lng, date, loops, elevation, half, participants, course_image, official_url, course_url, from_paris, other_races, participants_source] of ROWS) {
  const city_image = await cityImage(wiki);
  console.log(slug, city_image ? 'img ok' : 'PAS D\'IMAGE');
  out.push({ slug, name, lat, lng, date, loops, elevation, half, participants, city_image, course_image: course_image || null, official_url, course_url: course_url || null, from_paris, other_races: other_races || null, participants_source: participants_source || null });
}
mkdirSync('data', { recursive: true });
writeFileSync('data/marathons.json', JSON.stringify(out, null, 2));
console.log(out.length, 'marathons écrits dans data/marathons.json');
