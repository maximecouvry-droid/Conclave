import type { Marathon } from '@/lib/types';

/** Le « dossard » : élément visuel signature de la V1. */
export default function Bib({ m, no, tag, cls }: { m: Pick<Marathon, 'name' | 'info'>; no: number | string; tag?: string; cls?: string }) {
  return (
    <div className={`bib ${cls ?? ''}`}>
      <span className="no">{no}</span>
      <span className="nm">{m.name}</span>
      {m.info ? <span className="inf">{m.info}</span> : null}
      {tag ? <span className="tag">{tag}</span> : null}
    </div>
  );
}
