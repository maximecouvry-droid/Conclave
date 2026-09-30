'use client';
import { useRouter } from 'next/navigation';
import Meta from './Meta';

type M = { name: string; info?: string; slug?: string | null };

/** Le « dossard » : élément visuel signature de la V1, avec les infos clés du marathon. */
export default function Bib({ m, no, tag, cls, href }: { m: M; no: number | string; tag?: string; cls?: string; href?: string }) {
  const router = useRouter();
  const go = href ? () => router.push(href) : undefined;
  return (
    <div
      className={`bib ${href ? 'link' : ''} ${cls ?? ''}`}
      {...(go ? { role: 'link', tabIndex: 0, onClick: go, onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && go() } : {})}
    >
      <span className="no">{no}</span>
      <div className="bhd">
        <span className="nm">{m.name}</span>
        {tag ? <span className="tag">{tag}</span> : null}
      </div>
      {m.info ? <span className="inf">{m.info}</span> : null}
      <Meta slug={m.slug} />
    </div>
  );
}
