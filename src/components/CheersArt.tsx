/** Illustration d'accueil : deux chopes qui trinquent autour d'une urne de vote. */
const INK = 'var(--ink)';

function Mug() {
  return (
    <g>
      {/* anse */}
      <path d="M52 34h9c9 0 9 26 0 26h-9" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      {/* verre */}
      <rect x="0" y="14" width="54" height="66" rx="12" fill="#FFB703" stroke={INK} strokeWidth="4" />
      <rect x="10" y="30" width="7" height="38" rx="3.5" fill="#FFE08A" />
      <rect x="23" y="34" width="7" height="26" rx="3.5" fill="#FFE08A" />
      {/* mousse */}
      <path d="M-3 22c-2-10 7-15 14-10 3-9 17-10 21-1 7-6 18-1 17 8 0 6-4 9-10 9H6c-5 0-8-2-9-6z" fill="#FFFFFF" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    </g>
  );
}

export default function CheersArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 260 160" role="img" aria-label="Deux chopes de bière qui trinquent autour d'une urne de vote">
      {/* confettis */}
      <g>
        <circle cx="22" cy="26" r="5" fill="var(--coral)" />
        <rect x="238" y="22" width="9" height="9" rx="2" transform="rotate(20 242 26)" fill="var(--blue)" />
        <circle cx="236" cy="78" r="4" fill="var(--yellow)" />
        <rect x="10" y="84" width="8" height="8" rx="2" transform="rotate(-20 14 88)" fill="var(--grape)" />
        <circle cx="64" cy="10" r="3.5" fill="var(--blue)" />
        <rect x="196" y="8" width="8" height="8" rx="2" transform="rotate(30 200 12)" fill="var(--coral)" />
      </g>

      {/* chope gauche (anse à gauche) */}
      <g className="mug-l">
        <g transform="translate(88 44) scale(-1 1) rotate(-14 27 47)">
          <Mug />
        </g>
      </g>
      {/* chope droite */}
      <g className="mug-r">
        <g transform="translate(172 44) rotate(-14 27 47)">
          <Mug />
        </g>
      </g>

      {/* étincelles du « tchin » */}
      <g stroke="var(--coral)" strokeWidth="4" strokeLinecap="round">
        <path d="M130 14v14" />
        <path d="M112 22l8 11" />
        <path d="M148 22l-8 11" />
      </g>
      <circle cx="130" cy="8" r="3" fill="var(--yellow)" />

      {/* urne de vote */}
      <g>
        {/* bulletin */}
        <g transform="rotate(-8 130 66)">
          <rect x="114" y="46" width="32" height="42" rx="4" fill="#FFFFFF" stroke={INK} strokeWidth="3.5" />
          <path d="M121 62l5 5 9-11" fill="none" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M121 76h18" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <rect x="92" y="88" width="76" height="62" rx="12" fill="var(--blue)" stroke={INK} strokeWidth="4" />
        <rect x="88" y="80" width="84" height="16" rx="8" fill="var(--coral)" stroke={INK} strokeWidth="4" />
        <rect x="116" y="86" width="28" height="5" rx="2.5" fill={INK} />
        <circle cx="130" cy="124" r="11" fill="var(--yellow)" stroke={INK} strokeWidth="3.5" />
        <path d="M130 118l2 4 4 .6-3 3 .8 4.2-3.8-2-3.8 2 .8-4.2-3-3 4-.6z" fill={INK} />
      </g>
    </svg>
  );
}
