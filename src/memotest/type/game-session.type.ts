import { environment } from '../../environment/environment';

export class GameSession {
  gameBoardObjectId: string;
  players: string[] = [];
  cardsImage: string[] = environment.memotest.cardsImage;
  playingCardPosition = 0;
  constructor(gameBoardObjectId: string, player: string) {
    this.gameBoardObjectId = gameBoardObjectId;
    this.players.push(player);
  }
}
