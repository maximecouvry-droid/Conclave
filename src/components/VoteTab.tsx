'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import Rules from './Rules';
import type { TabProps, VP } from './tabctx';
import { QualBallot, QualReveal } from './vote/Qual';
import { Plead } from './vote/Plead';
import { ElimBallot, ElimLobby, ElimReveal } from './vote/Elim';
import { FinalBallot, FinalLobby, FinalReveal } from './vote/Final';
import { End } from './vote/End';

const STEPS = ['Qualifs', 'Plaidoiries', 'Éliminations', 'Finale'];
const IDX = { lobby: -1, qual: 0, qr: 0, plead: 1, elim: 2, final: 3, end: 4 } as const;

/**
 * Onglet 2 : le vote.
 * Tant que le Conclave n'est pas ouvert : les règles + « Conclave bientôt ouvert ».
 * Ensuite : l'écran correspondant à la phase courante (le même déroulé que la V1).
 */
export default function VoteTab(props: TabProps) {
  const { room, players, marathons, me, creds, refresh, refreshMe, setErr } = props;
  const [busy, setBusy] = useState(false);

  const run = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setErr('');
    setBusy(true);
    try {
      return await fn();
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const v: VP = {
    ...props,
    busy,
    M: (id) => marathons.find((m) => m.id === id) ?? { name: '?', info: '' },
    PN: (id) => players.find((p) => p.id === id)?.name ?? '?',
    act: async (type, extra = {}) => {
      await run(() => api(`/api/rooms/${room.code}/action`, { type, ...extra }, creds));
      await refresh();
    },
    submit: async (type, payload) => {
      const r = await run(() => api(`/api/rooms/${room.code}/ballot`, { type, payload }, creds));
      await Promise.all([refresh(), refreshMe()]);
      return r !== null;
    },
  };

  if (room.phase === 'lobby') {
    const ready = marathons.length >= 4 && players.length >= 3;
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
            <button className="primary" disabled={busy || !ready} onClick={async () => { await run(() => api(`/api/rooms/${room.code}/open`, {}, creds)); await refresh(); }}>
              {ready ? 'Ouvrir le Conclave' : 'Il faut 4 marathons et 3 coureurs'}
            </button>
          </div>
        ) : null}
      </>
    );
  }

  const stage = room.state.stage;
  let body: React.ReactNode = null;
  switch (room.phase) {
    case 'qual': body = <QualBallot v={v} />; break;
    case 'qr': body = room.state.qr ? <QualReveal v={v} /> : null; break;
    case 'plead': body = <Plead v={v} />; break;
    case 'elim':
      body = stage === 'voting' ? <ElimBallot v={v} /> : stage === 'reveal' && room.state.rv ? <ElimReveal v={v} /> : <ElimLobby v={v} />;
      break;
    case 'final':
      body = stage === 'voting' ? <FinalBallot v={v} /> : stage === 'reveal' && room.state.final ? <FinalReveal v={v} /> : <FinalLobby v={v} />;
      break;
    case 'end': body = <End v={v} />; break;
  }

  const idx = IDX[room.phase];
  return (
    <>
      {room.phase !== 'end' ? (
        <nav className="route">
          {STEPS.map((n, i) => <span key={n} className={i < idx ? 'done' : i === idx ? 'now' : ''}>{n}</span>)}
        </nav>
      ) : null}
      {body}
    </>
  );
}
