'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, currentRoom, saveCreds } from '@/lib/client';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // déjà dans une salle : on y retourne (on ne quitte une salle qu'en la quittant/supprimant)
  useEffect(() => {
    const cur = currentRoom();
    if (cur) router.replace(`/room/${cur}`);
    else setChecking(false);
  }, [router]);

  async function run(fn: () => Promise<string>) {
    setErr('');
    setBusy(true);
    try {
      router.push(`/room/${await fn()}`);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  const create = () =>
    run(async () => {
      const r = await api<{ code: string; playerId: string; token: string }>('/api/rooms', { name: hostName });
      saveCreds(r.code, { playerId: r.playerId, token: r.token });
      return r.code;
    });

  const join = () =>
    run(async () => {
      const c = code.trim().toUpperCase();
      const r = await api<{ playerId: string; token: string }>(`/api/rooms/${c}/join`, { name });
      saveCreds(c, r);
      return c;
    });

  if (checking) return null;

  return (
    <>
      <header className="top">
        <div className="brand"><i></i>Marathon du Marathon</div>
        <div className="tools"><ThemeToggle /></div>
      </header>
      <h1>Le Marathon<br />du Marathon</h1>
      <Link className="primary dark" href="/marathons" style={{ margin: '4px 0 20px' }}>Découvrir les marathons</Link>
      {err ? <div className="err">{err}</div> : null}

      <div className="panel">
        <h2>Rejoindre une salle</h2>
        <div className="prow"><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code de la salle" maxLength={5} autoCapitalize="characters" autoComplete="off" /></div>
        <div className="prow"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton prénom" maxLength={20} autoComplete="off" /></div>
        <button className="primary" disabled={busy || code.trim().length < 5 || !name.trim()} onClick={join}>Rejoindre</button>
      </div>

      <div className="panel">
        <h2>Créer une salle</h2>
        <p className="hint">Tu deviens l&apos;hôte : tu pilotes les phases.</p>
        <div className="prow"><input value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Ton prénom" maxLength={20} autoComplete="off" /></div>
        <button className="primary dark" disabled={busy || !hostName.trim()} onClick={create}>Créer la salle</button>
      </div>
    </>
  );
}
