import { Card } from './card.interface';
import { GameConfig } from './game-config.interface';
import { Player, PlayerId } from './player.interface';
import { Prize } from './prize.interface';

export type GameBoardStatus = 'playing' | 'waiting' | 'finished';
export interface GameBoard {
  id: string;
  room: string;
  cards: Card[];
  players: Player[];
  status: GameBoardStatus;
  cards_found: number;
  prize: Prize;
  who_plays: PlayerId;
  config: GameConfig;
}
