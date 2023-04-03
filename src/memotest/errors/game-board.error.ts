import { WsError } from '../../_type/ws-error.type';

export const GameBoardError: WsError = {
  cantStartGame: {
    message: 'You cant start a game if you are not the creator',
    code: 7,
  },
  invalidStatusForStartingGame: {
    message:
      'Status of the game board must be playing in order to start the game',
    code: 8,
  },
  playerNotFound: { message: 'Player not found in game board', code: 9 },
  incorrectTurn: { message: 'Incorrect turn', code: 10 },
};
