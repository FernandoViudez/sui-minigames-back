export class GameSession {
  gameBoardObjectId: string;
  creator: string;
  players: Player[];
  currentTurn: CurrentTurn;
  cardsImage: string[];
}

class CurrentTurn {
  cardsTurnedOver: Card[];
}

class Card {
  id: number;
  position: number;
}

class Player {
  address: string;
  id: number;
  socketId: string;
}
