import type { Creds } from '@/lib/client';
import type { Marathon, Me, Player, Room } from '@/lib/types';

export interface TabProps {
  room: Room;
  players: Player[];
  marathons: Marathon[];
  me: Me | null;
  creds: Creds;
  refresh: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setErr: (m: string) => void;
}

/** Props communes des écrans de vote. */
export interface VP extends TabProps {
  /** marathon par id */
  M: (id: string) => { name: string; info: string };
  /** nom d'un joueur par id */
  PN: (id: string) => string;
  /** action d'hôte (serveur) */
  act: (type: string, extra?: Record<string, unknown>) => Promise<void>;
  /** rend son bulletin secret */
  submit: (type: 'qual' | 'vote' | 'card' | 'final', payload: Record<string, unknown>) => Promise<boolean>;
  busy: boolean;
}
