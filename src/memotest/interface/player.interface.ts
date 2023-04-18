export type PlayerId = 1 | 2 | 3 | 4;
export interface Player {
  id: PlayerId;
  addr: string;
  can_play: boolean;
}
