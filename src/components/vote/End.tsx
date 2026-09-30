'use client';
import type { VP } from '../tabctx';
import Bib from '../Bib';
import { HostDock, Hint, OutList } from './shared';

export function End({ v }: { v: VP }) {
  const s = v.room.state;
  const w = v.M(s.winner ?? '');
  const t = s.final?.totals ?? {};
  const alive = s.alive ?? [];
  const carders = (s.final?.slips ?? []).filter((x) => x.card).map((x) => v.PN(x.p));
  const cardOut = (s.out ?? []).filter((o) => o.how === 'card').map((o) => v.M(o.id).name);
  return (
    <>
      <div className="winner">
        <div className="hint">L&apos;an prochain, on court à</div>
        <div className="huge">{w.name}</div>
        {w.info ? <p className="hint">{w.info}</p> : null}
        <div className="finish"></div>
      </div>
      <div className="panel">
        <h2>Score final</h2>
        {alive.slice().sort((a, b) => (t[b] ?? 0) - (t[a] ?? 0)).map((id, i) => (
          <Bib key={id} m={v.M(id)} no={i + 1} tag={(t[id] ?? 0) + ' pts'} cls={id === s.winner ? 'gold' : ''} />
        ))}
      </div>
      <div className="panel">
        <h2>Les cartons rouges</h2>
        <p>{carders.length ? `Joués par ${carders.join(', ')}${cardOut.length ? `, contre ${cardOut.join(', ')}` : ''}.` : "Personne n'a dégainé."}</p>
      </div>
      <div className="panel"><h2>Le parcours</h2><OutList v={v} /></div>
      <Hint v={v} />
      <HostDock v={v} type="new-game" label="Nouvelle partie" />
    </>
  );
}
