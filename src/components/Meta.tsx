'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCatalogEntry } from '@/lib/catalog';
import { stats } from '@/lib/format';
import { loadNote } from '@/lib/notes';

/**
 * Sous le nom d'un marathon : Date / Boucles / D+ / Participants,
 * et un petit « + » qui déplie « Notes perso » (lien vers la fiche détaillée).
 */
export default function Meta({ slug, noPlus }: { slug?: string | null; noPlus?: boolean }) {
  const m = useCatalogEntry(slug);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState('');
  if (!slug || !m) return null;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) setPreview(loadNote(slug).note.trim());
    setOpen(!open);
  };
  return (
    <>
      <div className="mrow">
        <span className="stats">
          {stats(m).map((s) => <span key={s.k} title={s.k}>{s.icon} {s.v}</span>)}
        </span>
        {noPlus ? null : (
          <button type="button" className="plus" onClick={toggle} aria-expanded={open} aria-label="Notes perso">{open ? '−' : '+'}</button>
        )}
      </div>
      {open ? (
        <Link className="notesbtn" href={`/marathons/${slug}`} onClick={stop}>
          <b>Notes perso</b>
          <span>{preview ? preview.slice(0, 60) + (preview.length > 60 ? '…' : '') : 'Voir la fiche détaillée'} →</span>
        </Link>
      ) : null}
    </>
  );
}
