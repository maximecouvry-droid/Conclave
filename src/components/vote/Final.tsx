'use client';
import { useEffect, useState } from 'react';
import type { VP } from '../tabctx';
import Bib from '../Bib';
import { Dock, Drum, Hint, HostDock, OutList, Timer, VoteStatus, Voted, shuffle } from './shared';

export function FinalLobby({ v }: { v: VP }) {
  const alive = v.room.state.alive ?? [];
  return (
    <>
      <div className="kicker">Finale</div>
      <h2>Les {alive.length} finalistes</h2>
      <p className="hint">Chacun répartit en secret ses points, 6 maximum sur un même marathon. Qui a joué son carton rouge n&apos;en a que 5.</p>
      {alive.map((id, i) => <Bib key={id} m={v.M(id)} no={i + 1} cls="gold" />)}
      <Timer v={v} dur={60} label="Derniers discours" />
      <OutList v={v} />
      <Hint v={v} />
      <HostDock v={v} type="start-vote" dark={false} label="Lancer le vote final" />
    </>
  );
}

export function FinalBallot({ v }: { v: VP }) {
  const alive = v.room.state.alive ?? [];
  const saved = v.me?.myBallot?.type === 'final' ? (v.me.myBallot.payload.alloc as Record<string, number>) : null;
  const [editing, setEditing] = useState(false);
  const [a, setA] = useState<Record<string, number>>({});
  const [ord] = useState(() => shuffle(alive));
  const budget = v.me?.cardAvailable ? 10 : 5;
  const cap = Math.min(6, budget);
  const used = Object.values(a).reduce((x, y) => x + y, 0);
  const rem = budget - used;

  if (saved && !editing)
    return <Voted v={v} label="Dépouiller la finale" type="final-start" onEdit={() => { setA(saved); setEditing(true); }} />;

  const bump = (id: string, d: number) => setA((x) => ({ ...x, [id]: Math.max(0, (x[id] ?? 0) + d) }));
  return (
    <>
      <div className="kicker">Finale</div>
      <h2>{v.PN(v.creds.playerId)}, répartis tes points</h2>
      <p className={`budget ${budget === 5 ? 'red' : ''}`}>{budget === 5 ? '🟥 Carton rouge joué. ' : ''}<b>{rem}</b> sur {budget} points restants, {cap} maximum par marathon.</p>
      {ord.map((id) => {
        const val = a[id] ?? 0;
        return (
          <div key={id} className="alloc">
            <span className="nm">{v.M(id).name}</span>
            <button className="step" disabled={val <= 0} onClick={() => bump(id, -1)} aria-label="Retirer un point">−</button>
            <span className="v">{val}</span>
            <button className="step" disabled={val >= cap || rem <= 0} onClick={() => bump(id, 1)} aria-label="Ajouter un point">+</button>
          </div>
        );
      })}
      <VoteStatus v={v} label="Dépouiller la finale" type="final-start" />
      <Dock>
        <button className="primary" disabled={rem !== 0 || v.busy} onClick={async () => {
          const alloc: Record<string, number> = {};
          alive.forEach((id) => (alloc[id] = a[id] ?? 0));
          if (await v.submit('final', { alloc })) setEditing(false);
        }}>Valider mes points</button>
      </Dock>
    </>
  );
}

export function FinalReveal({ v }: { v: VP }) {
  const s = v.room.state;
  const f = s.final!;
  const alive = s.alive ?? [];
  const n = f.n;
  const shown = f.slips.length;
  const part: Record<string, number> = {};
  alive.forEach((id) => (part[id] = 0));
  f.slips.forEach((sl) => Object.entries(sl.a).forEach(([id, x]) => (part[id] += x)));
  const lead = Math.max(...Object.values(part));
  const maxPossible = v.players.length * 10;

  const [coinDone, setCoinDone] = useState(!f.tieCoin);
  const [drum, setDrum] = useState(false);
  useEffect(() => {
    if (f.tieCoin && !coinDone && !drum) setDrum(true);
  }, [f.tieCoin, coinDone, drum]);

  const complete = shown >= n;
  const top = f.top ?? [];
  return (
    <>
      <div className="kicker">Finale, dépouillement</div>
      <h2>{shown === 0 ? 'Premier bulletin ?' : `Bulletin ${shown} sur ${n}`}</h2>
      <div className="bars">
        {alive.slice().sort((x, y) => part[y] - part[x]).map((id) => (
          <div key={id} className={`bar ${part[id] === lead && lead > 0 ? 'lead' : ''}`}>
            <div className="lb"><span>{v.M(id).name}</span><span>{part[id]}</span></div>
            <div className="tr"><div className="fl" style={{ width: Math.min(100, Math.round((part[id] / Math.max(1, maxPossible)) * 160)) + '%' }} /></div>
          </div>
        ))}
      </div>
      {f.slips.slice().reverse().map((sl, i) => {
        const b = sl.card ? 5 : 10;
        return (
          <div key={sl.p} className={`slip ${i === 0 ? 'pop' : ''}`}>
            <div className="hd"><span>{v.PN(sl.p)}</span><span className={`badge ${b === 5 ? 'red' : ''}`}>{b === 5 ? '🟥 5 points' : '10 points'}</span></div>
            <div className="pts">{alive.map((id) => v.M(id).name + ' ' + (sl.a[id] ?? 0)).join(', ')}</div>
          </div>
        );
      })}
      {!complete ? (
        <>
          <Hint v={v} />
          <HostDock v={v} type="final-next" label={shown === 0 ? 'Ouvrir le premier bulletin' : 'Bulletin suivant'} />
        </>
      ) : top.length === 1 ? (
        <>
          <Hint v={v} />
          <HostDock v={v} type="set-winner" extra={{ id: top[0] }} dark={false} label="Voir le vainqueur" />
        </>
      ) : (
        <>
          <div className="sep"></div>
          <div className="stage" style={{ paddingTop: 0 }}>
            <div className="calm">Égalité à {Math.max(...top.map((id) => f.totals?.[id] ?? 0))} points</div>
            <p className="lede" style={{ margin: '0 auto 14px' }}>30 secondes de discours pour chaque défenseur, puis vote à main levée.</p>
          </div>
          <Timer v={v} dur={30} label="Sprint final" />
          {v.me?.isHost ? top.map((id) => (
            <button key={id} className="primary" style={{ marginBottom: 8 }} disabled={v.busy} onClick={() => v.act('set-winner', { id })}>{v.M(id).name} l&apos;emporte à main levée</button>
          )) : null}
          {f.tieCoin && !coinDone && drum
            ? <Drum names={f.tieCoin.cands.map((id) => v.M(id).name)} result={v.M(f.tieCoin.winner).name} onDone={() => { setDrum(false); setCoinDone(true); }} />
            : <div className="drum center">{f.tieCoin && coinDone ? v.M(f.tieCoin.winner).name : ''}</div>}
          {v.me?.isHost
            ? f.tieCoin
              ? <button className="primary" disabled={v.busy || !coinDone} onClick={() => v.act('set-winner', { id: f.tieCoin!.winner })}>Voir le vainqueur</button>
              : <button className="primary dark" disabled={v.busy} onClick={() => v.act('final-coin')}>Toujours égalité : tirage au sort</button>
            : null}
        </>
      )}
    </>
  );
}
