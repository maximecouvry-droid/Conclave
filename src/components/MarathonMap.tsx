'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import type { CatalogMarathon } from '@/lib/catalog';

/** Petite carte : un point par ville du catalogue (clic = fiche du marathon). */
export default function MarathonMap({ items }: { items: CatalogMarathon[] }) {
  const el = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const pts = items.filter((m) => m.lat != null && m.lng != null);
    if (!el.current || !pts.length) return;
    let map: import('leaflet').Map | null = null;
    let dead = false;
    import('leaflet').then((L) => {
      if (dead || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView([48, 10], 4);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const style = getComputedStyle(document.documentElement);
      const blue = style.getPropertyValue('--blue').trim() || '#1667D9';
      const group = L.featureGroup();
      pts.forEach((m) => {
        L.circleMarker([m.lat!, m.lng!], { radius: 8, color: '#fff', weight: 2, fillColor: blue, fillOpacity: 1 })
          .bindTooltip(m.name, { direction: 'top', className: 'pin-label' })
          .on('click', () => router.push(`/marathons/${m.slug}`))
          .addTo(group);
      });
      group.addTo(map);
      map.fitBounds(group.getBounds().pad(0.15));
    });
    return () => {
      dead = true;
      map?.remove();
    };
  }, [items, router]);

  return <div ref={el} className="mapbox" aria-label="Carte des marathons" />;
}
