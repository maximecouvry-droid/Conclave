'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from './supabase-browser';
import { api, loadCreds, type Creds } from './client';
import type { Marathon, Me, Player, Room } from './types';

/** Suit la salle en temps réel (Realtime) : rooms, players, marathons ; + infos privées du joueur. */
export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [creds, setCreds] = useState<Creds | null>(null);
  const [loaded, setLoaded] = useState(false);
  const roomId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const sb = supabaseBrowser();
    let id = roomId.current;
    if (!id) {
      const r = await sb.from('rooms').select('*').eq('code', code.toUpperCase()).maybeSingle();
      if (!r.data) return setLoaded(true);
      id = roomId.current = r.data.id;
    }
    const [r, p, m] = await Promise.all([
      sb.from('rooms').select('*').eq('id', id).single(),
      sb.from('players').select('*').eq('room_id', id).order('created_at'),
      sb.from('marathons').select('*').eq('room_id', id).order('position'),
    ]);
    if (r.data) setRoom(r.data as Room);
    setPlayers((p.data ?? []) as Player[]);
    setMarathons((m.data ?? []) as Marathon[]);
    setLoaded(true);
  }, [code]);

  const refreshMe = useCallback(async () => {
    const c = loadCreds(code);
    setCreds(c);
    if (!c) return setMe(null);
    try {
      setMe(await api<Me>(`/api/rooms/${code}/me`, {}, c));
    } catch {
      setMe(null);
    }
  }, [code]);

  // chargement initial + abonnement Realtime
  useEffect(() => {
    let alive = true;
    const sb = supabaseBrowser();
    let ch: ReturnType<typeof sb.channel> | null = null;
    refresh().then(() => {
      if (!alive || !roomId.current) return;
      const id = roomId.current;
      ch = sb
        .channel(`room-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${id}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${id}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'marathons', filter: `room_id=eq.${id}` }, refresh)
        .subscribe();
    });
    // filet de sécurité : re-synchronise au retour sur l'onglet (téléphone verrouillé, réseau coupé)
    const onVis = () => document.visibilityState === 'visible' && (refresh(), refreshMe());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVis);
      if (ch) sb.removeChannel(ch);
    };
  }, [refresh, refreshMe]);

  // infos privées : à recharger quand l'étape change
  const step = room ? `${room.phase}|${room.round}|${room.state.stage}` : '';
  useEffect(() => {
    refreshMe();
  }, [refreshMe, step]);

  return { room, players, marathons, me, creds, loaded, refresh, refreshMe };
}
