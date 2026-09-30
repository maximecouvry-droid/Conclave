'use client';
import { useEffect, useState } from 'react';
import type { VP } from '../tabctx';
import Bib from '../Bib';
import { Drum, HostDock, Hint, Opt, VoteStatus, Voted, Dock, place, shuffle, useDraft } from './shared';

export function QualBallot({ v }: { v: VP }) {
  const need = Math.min(5, v.marathons.length);
  const saved = v.me?.myBallot?.type === 'qual' ? ((v.me.myBallot.payload.picks as string[]) ?? []) : null;
  const [editing, setEditing] = useDraft(v, 'editing', () => false);
  const [sel, setSel, clearSel] = useDraft<string[]>(v, 'sel', () => saved ?? []);
  const [ord] = useDraft(v, 'ord', () => shuffle(v.marathons.map((m) => m.id)));

  if (saved && !editing)
    return <Voted v={v} label="Révéler les qualifiés" type="qual-reveal" onEdit={() => { setSel(saved); setEditing(true); }} />;

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < need ? [...s, id] : s));
  return (
    <>
      <div className="kicker">Qualifs</div>
      <h2>{v.PN(v.creds.playerId)}, choisis tes {need} marathons</h2>
      <p className="hint">{sel.length} sur {need} sélectionnés</p>
      {ord.map((id) => <Opt key={id} m={v.M(id)} on={sel.includes(id)} onClick={() => toggle(id)} />)}
      <VoteStatus v={v} label="Révéler les qualifiés" type="qual-reveal" />
      <Dock>
        <button className="primary" disabled={sel.length !== need || v.busy} onClick={async () => { if (await v.submit('qual', { picks: sel })) { setEditing(false); clearSel(); } }}>
          Valider mon choix
        </button>
      </Dock>
    </>
  );
}

export function QualReveal({ v }: { v: VP }) {
  const q = v.room.state.qr!;
  const { n, aboveN, coin: c } = q;
  const [shown, setShown] = useState(q.revealed.length);
  const [drum, setDrum] = useState<{ names: string[]; result: string } | null>(null);

  // révèle les places une à une ; les places tirées au sort passent par le tambour
  useEffect(() => {
    if (q.revealed.length < shown) return setShown(q.revealed.length);
    if (drum || q.revealed.length === shown) return;
    const e = q.revealed[shown];
    if (e.drawn && c) {
      const done = q.revealed.slice(0, shown).map((x) => x.id);
      setDrum({ names: c.cands.filter((id) => !done.includes(id)).map((id) => v.M(id).name), result: v.M(e.id).name });
    } else setShown(shown + 1);
  }, [q.revealed.length, shown, drum]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextPos = n - shown;
  const isDraw = !!c && shown < n && nextPos > aboveN;
  const list = q.revealed.slice(0, shown).map((e, k) => ({ ...e, isNew: k === shown - 1 })).reverse();
  const wait = !!drum || shown < q.revealed.length;

  return (
    <>
      <div className="kicker">Qualifs</div>
      <h2>Les {n} qualifiés</h2>
      {isDraw && c ? (
        <div className="stage" style={{ padding: '8px 0 0' }}>
          <p className="hint">{c.cands.length} marathons à égalité ({c.cut} voix) pour {c.spots} place{c.spots > 1 ? 's' : ''}. Tirage au sort place par place.</p>
          {drum ? <Drum names={drum.names} result={drum.result} onDone={() => { setDrum(null); setShown((s) => s + 1); }} /> : <div className="drum">🎲</div>}
        </div>
      ) : null}
      {list.map((e) => (
        <Bib key={e.id} m={v.M(e.id)} no={e.pos} tag={e.count + ' voix' + (e.drawn ? ', au sort' : '')} cls={e.isNew ? 'new' : ''} />
      ))}
      {shown < n ? (
        <>
          <Hint v={v} />
          <HostDock v={v} type="qr-next" disabled={wait} label={isDraw ? `Tirage au sort pour la ${place(nextPos)} place` : `Révéler la ${place(nextPos)} place`} />
        </>
      ) : (
        <>
          {q.dropped?.length ? <p className="hint">Cités mais non qualifiés : {q.dropped.map((id) => v.M(id).name).join(', ')}.</p> : null}
          <Hint v={v} />
          <HostDock v={v} type="to-plead" dark={false} label="Passer aux plaidoiries" />
        </>
      )}
    </>
  );
}
