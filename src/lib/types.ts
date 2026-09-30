export type Phase = 'lobby' | 'qual' | 'qr' | 'plead' | 'elim' | 'final' | 'end';
export type Stage = 'lobby' | 'voting' | 'reveal';

/** Qualifs : ce qui a DÉJÀ été révélé, place par place (du dernier au 1er). */
export interface QrState {
  n: number;
  /** nombre de places décrochées sans tirage au sort */
  aboveN: number;
  revealed: { id: string; pos: number; count: number; drawn: boolean }[];
  /** égalité à la limite (publié au début du dépouillement, jamais avant) */
  coin: { cands: string[]; spots: number; cut: number } | null;
  /** cités mais non qualifiés (publié à la fin) */
  dropped?: string[];
}

/** Élimination : dépouillement d'un tour, étape par étape. */
export interface RvState {
  step: number;
  kind?: 'card' | 'nocard';
  n?: number;
  /** cibles des bulletins déjà ouverts, dans l'ordre d'ouverture */
  votes?: string[];
  card?: { coin: string[] | null; target: string | null; returned: number };
  outcome?: { kind: 'vote' | 'multi' | 'stay'; targets: string[]; tied?: string[]; toFinal?: boolean };
}

export interface FinalSlip {
  p: string;
  a: Record<string, number>;
  card: boolean;
}
export interface FinalState {
  n: number;
  slips: FinalSlip[];
  totals?: Record<string, number>;
  top?: string[];
  tieCoin?: { cands: string[]; winner: string };
}

/** État PUBLIC de la salle (jamais de résultat non révélé). */
export interface RoomState {
  stage?: Stage;
  /** ids des joueurs qui ont rendu leur bulletin pour l'étape en cours */
  voted?: string[];
  /** ids des marathons encore en lice, du mieux classé au moins bien */
  alive?: string[];
  out?: { id: string; round: number; how: 'vote' | 'card' }[];
  timer?: { endsAt: number; dur: number } | null;
  qr?: QrState;
  rv?: RvState;
  final?: FinalState;
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
  slug: string | null;
  status: 'pool' | 'alive' | 'out' | 'winner';
  qual_count: number | null;
}

/** Ce que le serveur dit à UN joueur, à propos de lui seul. */
export interface Me {
  isHost: boolean;
  cardAvailable: boolean;
  myBallot: { type: 'qual' | 'vote' | 'card' | 'final'; payload: Record<string, unknown> } | null;
}
