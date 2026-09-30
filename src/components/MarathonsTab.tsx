'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { EXAMPLE, parseList } from '@/lib/parse';
import Bib from './Bib';
import type { TabProps } from './tabctx';

/** Onglet 1 : la liste des marathons. L'hôte l'édite tant que le Conclave n'est pas ouvert. */
export default function MarathonsTab({ room, players, marathons, me, creds, refresh, setErr }: TabProps) {
  const editable = !!me?.isHost && room.phase === 'lobby';
  const [text, setText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // pré-remplit l'éditeur avec la liste enregistrée (sans écraser une saisie en cours)
  useEffect(() => {
    if (!dirty) setText(marathons.map((m) => (m.info ? `${m.name} ; ${m.info.split(', ').join(' ; ')}` : m.name)).join('\n'));
  }, [marathons, dirty]);

  const save = async () => {
    setErr('');
    setBusy(true);
    try {
      await api(`/api/rooms/${room.code}/marathons`, { text }, creds);
      setDirty(false);
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <>
      <div className="panel">
        <h2>Coureurs</h2>
        <p className="hint" style={{ margin: 0 }}>{players.map((p) => p.name).join(', ')}</p>
      </div>

      {editable ? (
        <div className="panel">
          <h2>Marathons <span className="count">{parseList(text).length}</span></h2>
          <p className="hint">Une ligne par marathon : <code>Ville ; critère ; critère</code></p>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => { setText(e.target.value); setDirty(true); }}
            placeholder="Lisbonne ; octobre ; une boucle ; semi le même jour"
          />
          <button className="link" onClick={() => { setText(EXAMPLE); setDirty(true); }}>Charger une liste d&apos;exemple</button>
          <button className="primary" disabled={busy || !dirty} onClick={save}>{dirty ? 'Enregistrer la liste' : 'Liste enregistrée ✓'}</button>
        </div>
      ) : (
        <>
          <h2>Les marathons en lice</h2>
          {marathons.length === 0 ? <p className="hint">L&apos;hôte n&apos;a pas encore collé la liste.</p> : null}
          {marathons.map((m, i) => (
            <Bib key={m.id} m={m} no={i + 1} cls={m.status === 'out' ? 'out' : ''} />
          ))}
        </>
      )}
    </>
  );
}
