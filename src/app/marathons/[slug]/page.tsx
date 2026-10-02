'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCatalog, type CatalogMarathon } from '@/lib/catalog';
import { fmtDate, fmtElevation, fmtLoops, fmtParticipants } from '@/lib/format';
import { loadNote, saveNote } from '@/lib/notes';

const Fact = ({ k, v, wide }: { k: string; v: string; wide?: boolean }) => (
  <div className={`fact ${wide ? 'wide' : ''}`}>
    <div className="k">{k}</div>
    <div className="v">{v}</div>
  </div>
);

function CourseImage({ m }: { m: CatalogMarathon }) {
  const [failed, setFailed] = useState(false);
  const url = m.course_image;
  const link = m.course_url || m.official_url;
  if (!url || /\.pdf($|\?)/i.test(url) || failed) {
    return (
      <p className="hint" style={{ margin: 0 }}>
        {url ? <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>Ouvrir le plan du parcours ↗</a> : 'Pas d’image du parcours pour le moment.'}
        {!url && link ? <> <a href={link} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>Voir sur le site ↗</a></> : null}
      </p>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="course" src={url} alt={`Parcours du marathon de ${m.name}`} loading="lazy" onError={() => setFailed(true)} />
    </a>
  );
}

export default function MarathonDetail() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const list = useCatalog();
  const m = list?.find((x) => x.slug === slug) ?? null;

  const [note, setNote] = useState('');
  const [rank, setRank] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const n = loadNote(slug);
    setNote(n.note);
    setRank(n.rank);
    setReady(true);
  }, [slug]);
  useEffect(() => {
    if (ready) saveNote(slug, { note, rank });
  }, [ready, slug, note, rank]);

  return (
    <>
      <button className="back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/marathons'))}>← Retour</button>

      {list === null ? <p className="hint">Chargement…</p> : null}
      {list && !m ? <p className="hint">Marathon introuvable.</p> : null}
      {m ? (
        <>
          <div className="hero">
            {m.city_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.city_image} alt={`Vue de ${m.name}`} referrerPolicy="no-referrer" />
            ) : null}
            <div className="shade"></div>
            {m.city_image ? <span className="credit">Photo : Wikipedia</span> : null}
            <div className="cap">
              <h1>{m.name}</h1>
              <div className="when">{fmtDate(m.date, true)}</div>
            </div>
          </div>

          <div className="facts">
            <Fact k="Date 2026" v={fmtDate(m.date)} />
            <Fact k="Boucles" v={fmtLoops(m.loops)} />
            <Fact k="D+" v={fmtElevation(m.elevation)} />
            <Fact k="Participants" v={fmtParticipants(m.participants)} />
            <Fact k="Semi" v={m.half ?? '?'} wide />
          </div>

          <div className="panel">
            <h2>Parcours</h2>
            <CourseImage m={m} />
          </div>

          <div className="panel">
            <h2>Depuis Paris</h2>
            <p style={{ margin: 0 }}>{m.from_paris ?? '?'}</p>
          </div>

          <div className="panel">
            <h2>Autres courses</h2>
            <p style={{ margin: 0 }}>{m.other_races || 'Aucune information.'}</p>
          </div>

          <div className="panel">
            <h2>Ranking perso</h2>
            <div className="stars" role="radiogroup" aria-label="Ranking perso">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={n <= rank ? 'on' : ''} role="radio" aria-checked={n === rank} aria-label={`${n} sur 5`} onClick={() => setRank(rank === n ? 0 : n)}>★</button>
              ))}
            </div>
            <p className="hint" style={{ margin: 0 }}>{rank ? `${rank} sur 5` : 'Pas encore noté'} · enregistré sur cet appareil</p>
          </div>

          <div className="panel">
            <h2>Notes perso</h2>
            <textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tes impressions, questions, logistique…" />
            <p className="hint" style={{ marginBottom: 0 }}>Enregistré automatiquement sur cet appareil uniquement.</p>
          </div>

          <div className="panel">
            <h2>Liens</h2>
            <div className="links">
              {m.official_url ? <a href={m.official_url} target="_blank" rel="noreferrer">Site officiel ↗</a> : null}
              {m.course_url ? <a href={m.course_url} target="_blank" rel="noreferrer">Page du parcours ↗</a> : null}
              {m.participants_source ? <a href={m.participants_source} target="_blank" rel="noreferrer">Source des participants ↗</a> : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
