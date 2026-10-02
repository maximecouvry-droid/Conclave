'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, currentRoom, saveCreds } from '@/lib/client';
import { useCatalog } from '@/lib/catalog';
import ThemeToggle from '@/components/ThemeToggle';

type Mode = 'join' | 'create';

export default function Home() {
  const router = useRouter();
  const catalog = useCatalog();
  const [mode, setMode] = useState<Mode>('join');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // déjà dans un conclave : on y retourne (on n'en sort qu'en le quittant ou en le supprimant)
  useEffect(() => {
    const cur = currentRoom();
    if (cur) router.replace(`/room/${cur}`);
    else setChecking(false);
  }, [router]);

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      if (mode === 'create') {
        const r = await api<{ code: string; playerId: string; token: string }>('/api/rooms', { name });
        saveCreds(r.code, { playerId: r.playerId, token: r.token });
        router.push(`/room/${r.code}`);
      } else {
        const c = code.trim().toUpperCase();
        const r = await api<{ playerId: string; token: string }>(`/api/rooms/${c}/join`, { name });
        saveCreds(c, r);
        router.push(`/room/${c}`);
      }
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  if (checking) return null;
  const ok = !!name.trim() && (mode === 'create' || code.trim().length === 5);

  return (
    <div className="hp">
      <div className="hp-glow" aria-hidden="true"></div>
      <header className="top">
        <div className="tools"><ThemeToggle /></div>
      </header>

      <section className="hp-hero">
        <h1 className="word">Conclave</h1>
        <div className="route-line" aria-hidden="true"><span></span><i></i></div>
      </section>

      <section className="ticket">
        <div className="seg2" role="tablist">
          <button role="tab" aria-selected={mode === 'join'} className={mode === 'join' ? 'on' : ''} onClick={() => { setMode('join'); setErr(''); }}>Rejoindre un conclave</button>
          <button role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? 'on' : ''} onClick={() => { setMode('create'); setErr(''); }}>Créer un conclave</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (ok && !busy) submit(); }}>
          {mode === 'join' ? (
            <>
              <label className="lab" htmlFor="code">Code du conclave</label>
              <input
                id="code"
                className="code-in"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                placeholder="·····"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </>
          ) : null}

          <label className="lab" htmlFor="name">Ton prénom</label>
          <input id="name" className="name-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom" maxLength={20} autoComplete="off" />

          {mode === 'create' ? <p className="hint" style={{ margin: '0 0 14px' }}>Tu deviens l&apos;hôte : tu pilotes les phases.</p> : null}
          {err ? <div className="err" style={{ marginTop: 14, marginBottom: 0 }}>{err}</div> : null}

          <button type="submit" className="primary" style={{ marginTop: 16 }} disabled={!ok || busy}>
            {mode === 'join' ? 'Rejoindre' : 'Créer le conclave'}
          </button>
        </form>
      </section>

      <Link className="discover" href="/marathons">
        <span className="pin" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
        </span>
        <span className="dtx">
          <b>Découvrir les marathons</b>
          <small>{catalog ? `${catalog.length} courses · carte et fiches` : 'Carte et fiches'}</small>
        </span>
        <span className="arr" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
