'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCatalogEntry } from '@/lib/catalog';
import { stats } from '@/lib/format';
import { loadNote, type PersonalNote } from '@/lib/notes';

/**
 * Sous le nom d'un marathon : Date / Boucles / D+ / Participants, ta note sur 5 si elle existe,
 * et un petit « + » qui déplie tes notes (s'il y en a) puis le lien vers la fiche détaillée.
 */
export default function Meta({ slug }: { slug?: string | null }) {
  const m = useCatalogEntry(slug);
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<PersonalNote>({ note: '', rank: 0 });
  useEffect(() => {
    if (slug) setMine(loadNote(slug));
  }, [slug]);
  if (!slug || !m) return null;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) setMine(loadNote(slug));
    setOpen(!open);
  };
  const text = mine.note.trim();
  return (
    <>
      <div className="mrow">
        <span className="stats">
          {stats(m).map((s) => <span key={s.k} title={s.k}>{s.icon} {s.v}</span>)}
          {mine.rank ? <span className="rate" title="Ta note">★ {mine.rank}/5</span> : null}
        </span>
        <button type="button" className="plus" onClick={toggle} aria-expanded={open} aria-label="Notes perso">{open ? '−' : '+'}</button>
      </div>
      {open ? (
        <div className="npanel" onClick={(e) => e.stopPropagation()}>
          {text ? <div className="ntext">{text}</div> : null}
          <Link className="notesbtn" href={`/marathons/${slug}`}>Voir la fiche détaillée →</Link>
        </div>
      ) : null}
    </>
  );
}
