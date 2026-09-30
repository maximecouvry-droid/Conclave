'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Les 2 onglets de l'app : Accueil (liste des marathons) et Vote. */
export default function MainTabs() {
  const path = usePathname();
  const onVote = path.startsWith('/vote') || path.startsWith('/room');
  return (
    <nav className="tabs" role="tablist">
      <Link role="tab" aria-selected={!onVote} className={!onVote ? 'on' : ''} href="/">Accueil</Link>
      <Link role="tab" aria-selected={onVote} className={onVote ? 'on' : ''} href="/vote">Vote</Link>
    </nav>
  );
}
