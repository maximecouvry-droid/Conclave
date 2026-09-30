import type { Creds } from '@/lib/client';
import type { Marathon, Me, Player, Room } from '@/lib/types';

export interface TabProps {
  room: Room;
  players: Player[];
  marathons: Marathon[];
  me: Me | null;
  creds: Creds;
  refresh: () => Promise<void>;
  setErr: (m: string) => void;
}
