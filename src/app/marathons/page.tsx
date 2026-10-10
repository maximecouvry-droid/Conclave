'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCatalog } from '@/lib/catalog';
import Bib from '@/components/Bib';
import { decodeNotes, encodeNotes, exportNotes, importNotes, loadNote, loadRanks, type NotesExport } from '@/lib/notes';

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
  // ---- transfert des notes vers / depuis un autre appareil ----
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [incoming, setIncoming] = useState<NotesExport | null>(null);
  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/notes=([A-Za-z0-9_-]+)/);
      if (m) setIncoming(decodeNotes(m[1]));
    };
    read();
    window.addEventListener('hashchange', read); // lien ouvert alors qu'on est déjà sur la page
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const makeLink = () => {
    const data = exportNotes((list ?? []).map((m) => m.slug));
    return { data, url: `${window.location.origin}/marathons#notes=${encodeNotes(data)}` };
  };
  const copyLink = async () => {
    const { data, url } = makeLink();
    if (!Object.keys(data).length) return setMsg('Aucune note à transférer pour le moment.');
    try {
      await navigator.clipboard.writeText(url);
      setMsg('Lien copié ! Envoie-le-toi (WhatsApp, e-mail…) puis ouvre-le sur ton autre appareil.');
    } catch {
      window.prompt('Copie ce lien :', url);
    }
  };
  const shareLink = async () => {
    const { data, url } = makeLink();
    if (!Object.keys(data).length) return setMsg('Aucune note à transférer pour le moment.');
    try {
      await navigator.share({ title: 'Mes notes marathons', url });
    } catch {}
  };
  // marathons du lien dont cet appareil a déjà une note ou des étoiles : ils seront remplacés
  const conflicts = incoming ? Object.keys(incoming).filter((slug) => { const l = loadNote(slug); return l.note.trim() || l.rank; }).length : 0;
  const doImport = () => {
    if (!incoming) return;
    importNotes(incoming);
    window.location.replace('/marathons');
  };
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <>
      <Link className="back" href="/">← Retour</Link>
      <h1>Marathons</h1>
      {incoming ? (
        <div className="panel">
          <h2>Importer des notes ?</h2>
          <p className="hint">{Object.keys(incoming).length} marathon{Object.keys(incoming).length > 1 ? 's' : ''} avec une note ou des étoiles. Les autres marathons ne sont pas touchés.{conflicts ? ` ${conflicts} d’entre eux ${conflicts > 1 ? 'ont' : 'a'} déjà une note ici : elle sera remplacée.` : ''}</p>
          <div className="row2">
            <button className="primary" onClick={doImport}>Importer</button>
            <button className="ghost" onClick={() => { setIncoming(null); history.replaceState(null, '', '/marathons'); }}>Ignorer</button>
          </div>
        </div>
      ) : null}
      <button className="link" onClick={() => setOpen(!open)}>{open ? '− Transférer mes notes' : '+ Transférer mes notes vers un autre appareil'}</button>
      {open ? (
        <div className="panel">
          <p className="hint" style={{ marginTop: 0 }}>Tes notes sont enregistrées uniquement sur cet appareil. Génère un lien, envoie-le-toi, puis ouvre-le sur l'autre appareil pour les y importer.</p>
          <div className="row2">
            <button className="primary" onClick={copyLink}>Copier le lien</button>
            {canShare ? <button className="ghost" onClick={shareLink}>Partager…</button> : null}
          </div>
          {msg ? <p className="hint" style={{ marginBottom: 0 }}>{msg}</p> : null}
        </div>
      ) : null}
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
