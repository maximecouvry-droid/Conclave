export type Phase = 'lobby' | 'qual' | 'qr' | 'plead' | 'elim' | 'final' | 'end';
export type Stage = 'lobby' | 'voting' | 'reveal';

/** État PUBLIC de la salle (jamais de résultat non révélé). */
export interface RoomState {
  stage?: Stage;
  /** ids des joueurs qui ont rendu leur bulletin pour l'étape en cours */
  voted?: string[];
  /** ids des marathons encore en lice (à partir des plaidoiries) */
  alive?: string[];
  /** éliminés, dans l'ordre */
  out?: { id: string; round: number; how: 'vote' | 'card' }[];
  /** avancement de la révélation en cours (étape suivante gérée par le serveur) */
  reveal?: Record<string, unknown>;
  winner?: string | null;
}

export interface Room {
  id: string;
  code: string;
  phase: Phase;
  round: number;
  state: RoomState;
  host_player_id: string | null;
}
export interface Player {
  id: string;
  room_id: string;
  name: string;
}
export interface Marathon {
  id: string;
  room_id: string;
  position: number;
  name: string;
  info: string;
  status: 'pool' | 'alive' | 'out' | 'winner';
  qual_count: number | null;
}

/** Ce que le serveur dit à UN joueur, à propos de lui seul. */
export interface Me {
  isHost: boolean;
  cardAvailable: boolean;
  myBallot: { type: 'qual' | 'vote' | 'card' | 'final'; payload: Record<string, unknown> } | null;
}
