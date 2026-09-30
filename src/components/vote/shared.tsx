'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { VP } from '../tabctx';
import Bib from '../Bib';
import Meta from '../Meta';

export const shuffle = <T,>(a: T[]): T[] => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
export const fmt = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
export const place = (n: number) => (n === 1 ? '1re' : n + 'e');

export const Dock = ({ children }: { children: ReactNode }) => <div className="dock">{children}</div>;

/** Bouton fixe en bas : visible uniquement pour l'hôte (c'est lui qui pilote). */
export function HostDock({ v, label, type, extra, disabled, dark = true, red }: { v: VP; label: string; type: string; extra?: Record<string, unknown>; disabled?: boolean; dark?: boolean; red?: boolean }) {
  if (!v.me?.isHost) return null;
  return (
    <Dock>
      <button className={`primary ${red ? 'red' : dark ? 'dark' : ''}`} disabled={v.busy || disabled} onClick={() => v.act(type, extra)}>
        {label}
      </button>
    </Dock>
  );
}

/** Pour les non-hôtes pendant une révélation. */
export const Hint = ({ v }: { v: VP }) => (v.me?.isHost ? null : <p className="hint center">L&apos;hôte pilote la suite.</p>);

/** « 3/4 ont voté » + bouton de dépouillement pour l'hôte (actif quand tout le monde a voté). */
export function VoteStatus({ v, label, type }: { v: VP; label: string; type: string }) {
  const voted = v.room.state.voted ?? [];
  const all = v.players.length > 0 && v.players.every((p) => voted.includes(p.id));
  return (
    <div className="panel">
      <b className="count" style={{ fontSize: 26 }}>{voted.length}/{v.players.length}</b> ont voté
      {v.me?.isHost ? (
        <button className="primary dark" style={{ marginTop: 12 }} disabled={!all || v.busy} onClick={() => v.act(type)}>
          {label}
        </button>
      ) : null}
    </div>
  );
}

/** Écran d'attente une fois son bulletin rendu. */
export function Voted({ v, label, type, onEdit }: { v: VP; label: string; type: string; onEdit: () => void }) {
  return (
    <>
      <div className="stage" style={{ paddingBottom: 0 }}>
        <div className="ack">✓ Ton vote est enregistré</div>
        <div className="huge">🗳️</div>
      </div>
      <VoteStatus v={v} label={label} type={type} />
      <button className="link" onClick={onEdit}>Modifier mon vote</button>
    </>
  );
}

/** Ce que voit un joueur qui n'a pas encore voté : à afficher sous le bulletin. */
export const Ballot = ({ v, label, type }: { v: VP; label: string; type: string }) => <VoteStatus v={v} label={label} type={type} />;

/** Marathon cliquable d'un bulletin (avec ses infos et son « + Notes perso »). */
export function Opt({ m, on, radio, onClick }: { m: { name: string; info: string; slug?: string | null }; on: boolean; radio?: boolean; onClick: () => void }) {
  return (
    <div
      role={radio ? 'radio' : 'checkbox'}
      aria-checked={on}
      tabIndex={0}
      className={`opt ${radio ? 'radio' : ''} ${on ? 'on' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onClick())}
    >
      <span className="ck"></span>
      <span className="tx">
        <span className="nm">{m.name}</span>
        {m.info ? <span className="inf">{m.info}</span> : null}
        <Meta slug={m.slug} />
      </span>
    </div>
  );
}

/** Liste des éliminés (V1 : « Déjà éliminés »). */
export function OutList({ v }: { v: VP }) {
  const out = v.room.state.out ?? [];
  if (!out.length) return null;
  return (
    <>
      <div className="sep"></div>
      <div className="hint">Déjà éliminés</div>
      {out.map((o) => (
        <Bib key={o.id} m={v.M(o.id)} no={'T' + o.round} tag={o.how === 'card' ? '🟥' : '🗳️'} cls="out" />
      ))}
    </>
  );
}

/** Chrono partagé : l'hôte le lance, tous les écrans le voient. */
export function Timer({ v, dur, label }: { v: VP; dur: number; label: string }) {
  const t = v.room.state.timer;
  const [now, setNow] = useState(() => Date.now());
  const dinged = useRef(false);
  useEffect(() => {
    if (!t) {
      dinged.current = false;
      return;
    }
    const i = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(i);
  }, [t]);
  const rem = t ? Math.max(0, Math.ceil((t.endsAt - now) / 1000)) : dur;
  const over = !!t && rem <= 0;
  useEffect(() => {
    if (over && !dinged.current) {
      dinged.current = true;
      try { navigator.vibrate?.([200, 100, 200]); } catch {}
    }
  }, [over]);
  return (
    <div className="timer">
      <div className="hint" style={{ marginTop: 0 }}>{label}</div>
      <div className={`tval ${over ? 'ding' : ''}`}>{fmt(t ? rem : dur)}</div>
      {v.me?.isHost ? (
        <div className="row2">
          <button className="primary" disabled={v.busy} onClick={() => v.act('timer-start', { dur })}>Lancer le chrono</button>
          <button className="ghost" disabled={v.busy} onClick={() => v.act('timer-reset')}>Remettre à {fmt(dur)}</button>
        </div>
      ) : null}
    </div>
  );
}

/** Tambour visuel : le résultat est déjà décidé par le serveur, on ne fait que l'animer. */
export function Drum({ names, result, onDone }: { names: string[]; result: string; onDone: () => void }) {
  const [txt, setTxt] = useState('🎲');
  const [landed, setLanded] = useState(false);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const pool = shuffle(names.length ? names : [result]);
    let i = 0;
    let delay = 55;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTxt(pool[i++ % pool.length]);
      delay *= 1.1;
      if (delay < 430) t = setTimeout(tick, delay);
      else {
        setTxt(result);
        setLanded(true);
        t = setTimeout(() => done.current(), 1100);
      }
    };
    tick();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className={`drum ${landed ? 'landed' : ''}`}>{txt}</div>;
}
