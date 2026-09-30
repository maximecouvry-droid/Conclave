// Charge data/marathons.json dans la table Supabase « catalog » (upsert par slug).
// Usage : npm run seed   (lit .env.local)
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const rows = JSON.parse(readFileSync('data/marathons.json', 'utf8')).map((m, i) => ({ ...m, position: i }));
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const up = await sb.from('catalog').upsert(rows, { onConflict: 'slug' });
if (up.error) {
  console.error('Échec :', up.error.message);
  if (/relation|does not exist|schema cache/i.test(up.error.message)) console.error("→ Exécute d'abord supabase/migration_002_catalog.sql dans le SQL Editor de Supabase.");
  process.exit(1);
}
// retire du catalogue ce qui n'est plus dans le fichier
const del = await sb.from('catalog').delete().not('slug', 'in', `(${rows.map((r) => r.slug).join(',')})`);
if (del.error) console.error('Nettoyage :', del.error.message);
console.log(rows.length, 'marathons dans le catalogue.');
