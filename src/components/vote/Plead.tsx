'use client';
import type { VP } from '../tabctx';
import Bib from '../Bib';
import { HostDock, Hint, Timer } from './shared';

export function Plead({ v }: { v: VP }) {
  const alive = v.room.state.alive ?? [];
  return (
    <>
      <div className="kicker">Plaidoiries</div>
      <h2>Une minute chacun</h2>
      <p className="hint">Défends ton favori, ou descends celui qu&apos;il faut sortir absolument.</p>
      <Timer v={v} dur={60} label="Chrono de plaidoirie" />
      {alive.map((id, i) => <Bib key={id} m={v.M(id)} no={i + 1} />)}
      <Hint v={v} />
      <HostDock v={v} type="to-elim" dark={false} label="Lancer les éliminations" />
    </>
  );
}
