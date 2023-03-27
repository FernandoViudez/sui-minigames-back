import { Card } from './card.interface';
import { GameConfig } from './game-config.interface';
import { Player, PlayerId } from './player.interface';
import { Prize } from './prize.interface';

export type GameBoardStatus = 'playing' | 'waiting' | 'finished';
export interface GameBoard {
  id: { id: string };
  room: string;
  cards: { fields: Card }[];
  players: { fields: Player }[];
  status: GameBoardStatus;
  cards_found: number;
  prize: { fields: Prize };
  who_plays: PlayerId;
  config: { fields: GameConfig };
}
