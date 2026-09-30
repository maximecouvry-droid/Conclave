'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, saveCreds } from '@/lib/client';
import { useRoom } from '@/lib/useRoom';
import ThemeToggle from './ThemeToggle';
import MainTabs from './MainTabs';
import MarathonsTab from './MarathonsTab';
import VoteTab from './VoteTab';

type Tab = 'marathons' | 'vote';

export default function RoomClient({ code }: { code: string }) {
  const { room, players, marathons, me, creds, loaded, refresh, refreshMe } = useRoom(code);
  const [tab, setTab] = useState<Tab>('marathons');
  const [err, setErr] = useState('');

  if (!loaded) return <p className="hint center" style={{ paddingTop: 80 }}>Chargement…</p>;
  if (!room)
    return (
      <div className="stage">
        <h2>Salle introuvable</h2>
        <p className="hint">Vérifie le code : {code}</p>
        <Link className="link" href="/">Retour</Link>
      </div>
    );

  // arrivé par un lien sans avoir rejoint : on demande le pseudo
  if (!creds) return <JoinHere code={code} onDone={refreshMe} locked={room.phase !== 'lobby'} />;

  const undo = async () => {
    setErr('');
    try {
      await api(`/api/rooms/${code}/undo`, {}, creds);
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const ctx = { room, players, marathons, me, creds, refresh, setErr };
  return (
    <>
      <header className="top">
        <div className="brand"><i></i>Marathon du Marathon</div>
        <div className="tools">
          {me?.isHost ? <button className="ghost" onClick={undo}>Annuler</button> : null}
          <ThemeToggle />
        </div>
      </header>

      <MainTabs />

      <div className="roomcode">Salle <b>{code}</b> · {players.length} coureur{players.length > 1 ? 's' : ''}</div>

      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'marathons'} className={tab === 'marathons' ? 'on' : ''} onClick={() => setTab('marathons')}>
          Marathons <span className="count">{marathons.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'vote'} className={tab === 'vote' ? 'on' : ''} onClick={() => setTab('vote')}>
          Conclave{room.phase === 'lobby' ? '' : ' •'}
        </button>
      </nav>

      {err ? <div className="err">{err}</div> : null}
      {tab === 'marathons' ? <MarathonsTab {...ctx} /> : <VoteTab {...ctx} />}
    </>
  );
}

function JoinHere({ code, onDone, locked }: { code: string; onDone: () => void; locked: boolean }) {
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const go = async () => {
    try {
      saveCreds(code, await api(`/api/rooms/${code}/join`, { name }));
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <>
      <h1>Salle {code}</h1>
      {locked ? <div className="err">Le Conclave a déjà commencé, on ne peut plus rejoindre.</div> : null}
      {err ? <div className="err">{err}</div> : null}
      <div className="panel">
        <div className="prow"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom" maxLength={20} autoComplete="off" /></div>
        <button className="primary" disabled={locked || !name.trim()} onClick={go}>Rejoindre</button>
      </div>
    </>
  );
}
