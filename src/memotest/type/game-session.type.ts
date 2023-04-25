import { environment } from '../../environment/environment';

export class GameSession {
  gameBoardObjectId: string;
  players: string[] = [];
  cardsImage: string[] = environment.memotest.cardsImage;
  currentTurn: {
    cards: {
      position: number;
    }[];
    playerId?: number;
    lastTurnDate?: number;
    forceUpdateAvailable: boolean;
  } = {
    cards: [],
    forceUpdateAvailable: true,
  };
  constructor(gameBoardObjectId: string, player: string) {
    this.gameBoardObjectId = gameBoardObjectId;
    this.players.push(player);
  }
}
