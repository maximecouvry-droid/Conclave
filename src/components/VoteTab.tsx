'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import Rules from './Rules';
import type { TabProps } from './tabctx';

/**
 * Onglet 2 : le vote.
 * Tant que le Conclave n'est pas ouvert : les règles + « Conclave bientôt ouvert ».
 * Les écrans de vote de chaque phase (qualifs, élims, finale) arrivent à l'étape suivante.
 */
export default function VoteTab({ room, players, marathons, me, creds, refresh, setErr }: TabProps) {
  const [busy, setBusy] = useState(false);

  if (room.phase === 'lobby') {
    const ready = marathons.length >= 4 && players.length >= 3;
    const open = async () => {
      setErr('');
      setBusy(true);
      try {
        await api(`/api/rooms/${room.code}/open`, {}, creds);
        await refresh();
      } catch (e) {
        setErr((e as Error).message);
      }
      setBusy(false);
    };
    return (
      <>
        <div className="stage" style={{ paddingBottom: 8 }}>
          <div className="huge">🗳️</div>
          <h2>Conclave bientôt ouvert</h2>
          <p className="hint">En attendant, relis les règles.</p>
        </div>
        <div className="panel"><h2>Règles</h2><Rules /></div>
        {me?.isHost ? (
          <div className="dock">
            <button className="primary" disabled={busy || !ready} onClick={open}>
              {ready ? 'Ouvrir le Conclave' : 'Il faut 4 marathons et 3 coureurs'}
            </button>
          </div>
        ) : null}
      </>
    );
  }

  // phases suivantes : squelette (prochaine étape du chantier)
  const voted = room.state.voted ?? [];
  return (
    <div className="stage">
      <div className="kicker">Phase : {room.phase}</div>
      <h2>Le Conclave est ouvert</h2>
      <p className="hint">{voted.length}/{players.length} ont voté</p>
      <p className="hint">Écrans de vote à venir (étape suivante).</p>
    </div>
  );
}
