'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCatalog } from '@/lib/catalog';
import ThemeToggle from '@/components/ThemeToggle';
import Bib from '@/components/Bib';

// Leaflet touche à `window` : rendu côté navigateur uniquement
const MarathonMap = dynamic(() => import('@/components/MarathonMap'), { ssr: false, loading: () => <div className="mapbox" /> });

export default function MarathonsPage() {
  const list = useCatalog();
  const sorted = list ? list.slice().sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')) : null;
  return (
    <>
      <header className="top">
        <div className="brand"><i></i>Marathon du Marathon</div>
        <div className="tools"><ThemeToggle /></div>
      </header>
      <Link className="back" href="/">← Retour</Link>
      <h1>Marathons</h1>
      {sorted === null ? <p className="hint">Chargement…</p> : null}
      {sorted && sorted.length === 0 ? <p className="hint">Aucun marathon dans le catalogue.</p> : null}
      {sorted && sorted.length ? (
        <>
          <MarathonMap items={sorted} />
          <p className="hint">{sorted.length} marathons, classés par date.</p>
          {sorted.map((m, i) => (
            <Bib key={m.slug} m={m} no={i + 1} href={`/marathons/${m.slug}`} />
          ))}
        </>
      ) : null}
    </>
  );
}
