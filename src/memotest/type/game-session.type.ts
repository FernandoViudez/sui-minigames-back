import { environment } from '../../environment/environment';

export class GameSession {
  gameBoardObjectId: string;
  players: string[] = [];
  cardsImage: string[] = environment.memotest.cardsImage;
  currentTurn: {
    cards: {
      id: number;
      position: number;
    }[];
    playerId?: number;
  } = {
    cards: [],
  };
  constructor(gameBoardObjectId: string, player: string) {
    this.gameBoardObjectId = gameBoardObjectId;
    this.players.push(player);
  }
}
