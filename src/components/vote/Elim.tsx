'use client';
import { useEffect, useState } from 'react';
import type { VP } from '../tabctx';
import Bib from '../Bib';
import { Dock, Drum, Hint, HostDock, Opt, OutList, VoteStatus, Voted, shuffle } from './shared';

export function ElimLobby({ v }: { v: VP }) {
  const alive = v.room.state.alive ?? [];
  return (
    <>
      <div className="kicker">Tour {v.room.round}</div>
      <h2>Il reste {alive.length} marathons</h2>
      <p className="hint">Discutez, négociez, bluffez. En cas d&apos;égalité, tous les ex-aequo sortent si c&apos;est possible.</p>
      {alive.map((id, i) => <Bib key={id} m={v.M(id)} no={i + 1} />)}
      <OutList v={v} />
      <Hint v={v} />
      <HostDock v={v} type="start-vote" dark={false} label="Lancer le vote du tour" />
    </>
  );
}

export function ElimBallot({ v }: { v: VP }) {
  const alive = v.room.state.alive ?? [];
  const saved = v.me?.myBallot && (v.me.myBallot.type === 'vote' || v.me.myBallot.type === 'card') ? v.me.myBallot : null;
  const [editing, setEditing] = useState(false);
  const [t, setT] = useState<string | null>(null);
  const [card, setCard] = useState(false);
  const [ord] = useState(() => shuffle(alive));
  const hasCard = !!v.me?.cardAvailable;

  if (saved && !editing)
    return (
      <Voted v={v} label="Dépouiller" type="resolve" onEdit={() => { setT(saved.payload.target as string); setCard(saved.type === 'card'); setEditing(true); }} />
    );

  return (
    <div className={card ? 'redmode' : ''}>
      <div className="kicker">Tour {v.room.round}</div>
      <h2>{v.PN(v.creds.playerId)}, {card ? 'qui prend ton carton rouge ?' : 'qui doit sortir ?'}</h2>
      {card ? <div className="redbanner">🟥 Carton rouge dégainé</div> : null}
      {ord.map((id) => <Opt key={id} m={v.M(id)} radio on={t === id} onClick={() => setT(id)} />)}
      {hasCard ? (
        <>
          <button className={`cardbtn ${card ? 'on' : ''}`} onClick={() => setCard(!card)}>{card ? 'Ranger mon carton rouge' : '🟥 Dégainer mon carton rouge'}</button>
          <p className="hint">{card ? "Ton choix sortira d'office, quels que soient les votes. Prix : 5 points au lieu de 10 en finale." : "Une seule fois dans la partie. Le marathon visé sort d'office, mais tu n'auras que 5 points en finale."}</p>
        </>
      ) : <p className="hint center">Ton carton rouge a déjà été joué.</p>}
      <VoteStatus v={v} label="Dépouiller" type="resolve" />
      <Dock>
        <button className={`primary ${card ? 'red' : ''}`} disabled={!t || v.busy} onClick={async () => { if (await v.submit(card ? 'card' : 'vote', { target: t })) setEditing(false); }}>
          {card ? 'Valider mon carton rouge' : 'Valider mon vote'}
        </button>
      </Dock>
    </div>
  );
}

function TallyBars({ v, cands, votes, last }: { v: VP; cands: string[]; votes: string[]; last?: string }) {
  const t: Record<string, number> = {};
  cands.forEach((id) => (t[id] = 0));
  votes.forEach((id) => (t[id] = (t[id] ?? 0) + 1));
  const max = Math.max(1, ...Object.values(t));
  return (
    <div className="bars">
      {cands.slice().sort((a, b) => t[b] - t[a]).map((id) => (
        <div key={id} className={`bar ${t[id] === max && t[id] > 0 ? 'hot' : ''}`}>
          <div className="lb"><span>{v.M(id).name}{id === last ? ' ◂' : ''}</span><span>{t[id]}</span></div>
          <div className="tr"><div className="fl" style={{ width: Math.round((t[id] / v.players.length) * 100) + '%' }} /></div>
        </div>
      ))}
    </div>
  );
}

export function ElimReveal({ v }: { v: VP }) {
  const s = v.room.state;
  const rv = s.rv!;
  const alive = s.alive ?? [];
  const card = rv.card;
  const [coinDone, setCoinDone] = useState(!card?.coin || !!card?.target);
  const [drum, setDrum] = useState(false);
  useEffect(() => {
    if (card?.coin && card.target && !coinDone && !drum) setDrum(true);
  }, [card?.coin, card?.target, coinDone, drum]);

  const title = <div className="kicker">Tour {v.room.round}, dépouillement</div>;
  const names = (ids: string[]) => ids.map((id) => v.M(id).name).join(' et ');

  if (rv.step === 0)
    return (
      <>
        {title}
        <div className="stage"><div className="huge">🟥 ?</div><p className="lede" style={{ margin: '0 auto' }}>Quelqu&apos;un a-t-il dégainé son carton rouge ce tour-ci ?</p></div>
        <Hint v={v} />
        <HostDock v={v} type="rv-next" label="Réponse" />
      </>
    );

  if (rv.kind === 'card' && card) {
    return (
      <>
        {title}
        <div className="stage">
          <div className="redcard">CARTON ROUGE</div>
          {card.coin && !coinDone ? (
            <>
              <p className="lede" style={{ margin: '0 auto' }}>Plusieurs cartons sur des marathons différents. Un seul sort : tirage au sort.</p>
              {drum && card.target
                ? <Drum names={card.coin.map((id) => v.M(id).name)} result={v.M(card.target).name} onDone={() => { setDrum(false); setCoinDone(true); }} />
                : <div className="drum">🎲</div>}
            </>
          ) : (
            <>
              <div className="eliminated">{card.target ? v.M(card.target).name : ''}</div>
              <p className="hint">sort d&apos;office.</p>
              {card.returned ? <p className="hint">{card.returned > 1 ? `${card.returned} cartons non appliqués sont rendus à leurs propriétaires` : 'Un carton non appliqué est rendu à son propriétaire'}, sans pénalité.</p> : null}
            </>
          )}
        </div>
        <Hint v={v} />
        {card.coin && !coinDone
          ? <HostDock v={v} type="rv-next" label="Tirage au sort" disabled={drum || !!card.target} />
          : <HostDock v={v} type="apply" dark={false} label="Continuer" />}
      </>
    );
  }

  const votes = rv.votes ?? [];
  const n = rv.n ?? 0;
  if (!votes.length)
    return (
      <>
        {title}
        <div className="stage"><div className="calm">Aucun carton rouge ce tour.</div><p className="lede" style={{ margin: '0 auto' }}>On ouvre les {n} bulletins un par un.</p></div>
        <Hint v={v} />
        <HostDock v={v} type="rv-next" label="Ouvrir le premier bulletin" />
      </>
    );

  const last = votes[votes.length - 1];
  const o = rv.outcome;
  return (
    <>
      {title}
      <div className="lastvote">Bulletin {votes.length} sur {n} : {v.M(last).name}</div>
      <TallyBars v={v} cands={alive} votes={votes} last={last} />
      {!o ? (
        <>
          <Hint v={v} />
          <HostDock v={v} type="rv-next" label="Bulletin suivant" />
        </>
      ) : (
        <>
          {o.kind === 'vote' ? <div className="stage"><div className="eliminated">{names(o.targets)}</div><p className="hint">est éliminé.</p></div> : null}
          {o.kind === 'multi' ? (
            <div className="stage"><div className="calm">Égalité</div><div className="eliminated">{o.targets.map((id) => <div key={id}>{v.M(id).name}</div>)}</div><p className="hint">sortent tous ensemble.{alive.length - o.targets.length === 3 ? ' Direction la finale.' : ''}</p></div>
          ) : null}
          {o.kind === 'stay' ? (
            <div className="stage"><div className="calm">Égalité : personne ne sort</div><p className="lede" style={{ margin: '0 auto' }}>{o.toFinal ? `Impossible de sortir ${names(o.tied ?? [])} tous ensemble. La finale se joue à ${alive.length}.` : "Trop d'ex-aequo pour tous les sortir. On rediscute et on revote."}</p></div>
          ) : null}
          <Hint v={v} />
          <HostDock v={v} type="apply" dark={false} label={o.kind === 'stay' ? (o.toFinal ? 'Aller en finale' : 'Tour suivant') : 'Continuer'} />
        </>
      )}
    </>
  );
}
