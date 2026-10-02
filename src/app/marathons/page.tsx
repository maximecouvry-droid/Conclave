'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCatalog } from '@/lib/catalog';
import ThemeToggle from '@/components/ThemeToggle';
import Bib from '@/components/Bib';
import { loadRanks } from '@/lib/notes';

// Leaflet touche à `window` : rendu côté navigateur uniquement
const MarathonMap = dynamic(() => import('@/components/MarathonMap'), { ssr: false, loading: () => <div className="mapbox" /> });

export default function MarathonsPage() {
  const list = useCatalog();
  const [by, setBy] = useState<'date' | 'notes'>('date');
  const [ranks, setRanks] = useState<Record<string, number>>({});
  useEffect(() => {
    if (list) setRanks(loadRanks(list.map((m) => m.slug)));
  }, [list]);
  // par notes : les notés d'abord (meilleure note en tête), puis les non notés par date
  const sorted = useMemo(() => {
    if (!list) return null;
    const byDate = (a: { date: string | null }, b: { date: string | null }) => (a.date ?? '').localeCompare(b.date ?? '');
    return list.slice().sort((a, b) => (by === 'notes' ? (ranks[b.slug] || 0) - (ranks[a.slug] || 0) : 0) || byDate(a, b));
  }, [list, by, ranks]);
  return (
    <>
      <header className="top">
        <div className="tools"><ThemeToggle /></div>
      </header>
      <Link className="back" href="/">← Retour</Link>
      <h1>Marathons</h1>
      {sorted === null ? <p className="hint">Chargement…</p> : null}
      {sorted && sorted.length === 0 ? <p className="hint">Aucun marathon dans le catalogue.</p> : null}
      {sorted && sorted.length ? (
        <>
          <MarathonMap items={list ?? []} />
          <div className="seg" role="group" aria-label="Trier">
            <button className={by === 'date' ? 'on' : ''} onClick={() => setBy('date')}>Par date</button>
            <button className={by === 'notes' ? 'on' : ''} onClick={() => setBy('notes')}>Par notes</button>
          </div>
          {sorted.map((m, i) => (
            <Bib key={m.slug} m={m} no={i + 1} href={`/marathons/${m.slug}`} />
          ))}
        </>
      ) : null}
    </>
  );
}
