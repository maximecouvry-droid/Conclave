'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, forgetRoom, saveCreds } from '@/lib/client';
import { useRoom } from '@/lib/useRoom';
import VoteTab from './VoteTab';

export default function RoomClient({ code }: { code: string }) {
  const { room, players, marathons, me, creds, loaded, refresh, refreshMe } = useRoom(code);
  const [err, setErr] = useState('');
  const router = useRouter();
  // salle supprimée : on oublie la salle courante
  useEffect(() => {
    if (loaded && !room) forgetRoom(code);
  }, [loaded, room, code]);

  if (!loaded) return <p className="hint center" style={{ paddingTop: 80 }}>Chargement…</p>;
  if (!room)
    return (
      <div className="stage">
        <h2>Conclave introuvable</h2>
        <p className="hint">Vérifie le code : {code}</p>
        <Link className="link" href="/">Créer ou rejoindre un conclave</Link>
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

  const leave = () => {
    forgetRoom(code);
    router.push('/');
  };
  const deleteRoom = async () => {
    if (!confirm('Supprimer le conclave pour tout le monde ? Cette action est définitive.')) return;
    try {
      await api(`/api/rooms/${code}/action`, { type: 'delete-room' }, creds);
      leave();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const restart = async () => {
    if (!confirm('Recommencer une nouvelle partie ? Les coureurs et la liste sont conservés.')) return;
    try {
      await api(`/api/rooms/${code}/action`, { type: 'new-game' }, creds);
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const ctx = { room, players, marathons, me, creds, refresh, refreshMe, setErr };
  return (
    <>
      <div className="roomline">
        <div className="roomcode">Conclave <b>{code}</b> · {players.length} coureur{players.length > 1 ? 's' : ''}</div>
        {me?.isHost ? <button className="ghost" onClick={undo}>Annuler</button> : null}
      </div>

      {err ? <div className="err">{err}</div> : null}
      <VoteTab {...ctx} />

      <div className="sep"></div>
      <div className="row2" style={{ marginBottom: 24 }}>
        {me?.isHost && room.phase !== 'lobby' ? <button className="ghost" onClick={restart}>Recommencer</button> : null}
        {me?.isHost
          ? <button className="ghost" onClick={deleteRoom}>Supprimer le conclave</button>
          : <button className="ghost" onClick={() => confirm('Quitter le conclave ?') && leave()}>Quitter le conclave</button>}
      </div>
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
      <h1>Conclave {code}</h1>
      {locked ? <div className="err">Ce conclave a déjà commencé, on ne peut plus le rejoindre.</div> : null}
      {err ? <div className="err">{err}</div> : null}
      <div className="panel">
        <div className="prow"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom" maxLength={20} autoComplete="off" /></div>
        <button className="primary" disabled={locked || !name.trim()} onClick={go}>Rejoindre</button>
      </div>
    </>
  );
}
