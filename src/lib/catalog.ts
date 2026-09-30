'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from './supabase-browser';

/** Fiche d'un marathon du catalogue (table Supabase « catalog », fixée en amont). */
export interface CatalogMarathon {
  slug: string;
  position: number;
  name: string;
  lat: number | null;
  lng: number | null;
  date: string | null;
  loops: string | null;
  elevation: string | null;
  half: string | null;
  participants: number | null;
  city_image: string | null;
  course_image: string | null;
  official_url: string | null;
  course_url: string | null;
  from_paris: string | null;
  other_races: string | null;
  participants_source: string | null;
}

let cache: CatalogMarathon[] | null = null;
let inflight: Promise<CatalogMarathon[]> | null = null;

function load(): Promise<CatalogMarathon[]> {
  if (cache) return Promise.resolve(cache);
  inflight ??= (async () => {
    const r = await supabaseBrowser().from('catalog').select('*').order('position');
    cache = (r.data ?? []) as CatalogMarathon[];
    inflight = null;
    return cache;
  })();
  return inflight;
}

/** Tout le catalogue (null pendant le chargement). */
export function useCatalog(): CatalogMarathon[] | null {
  const [list, setList] = useState<CatalogMarathon[] | null>(cache);
  useEffect(() => {
    let ok = true;
    if (!cache) load().then((l) => ok && setList(l));
    return () => { ok = false; };
  }, []);
  return list;
}

export function useCatalogEntry(slug?: string | null): CatalogMarathon | null {
  const list = useCatalog();
  return (slug && list?.find((m) => m.slug === slug)) || null;
}
