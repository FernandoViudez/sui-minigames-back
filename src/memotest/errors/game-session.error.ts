import { WsError } from '../../_type/ws-error.type';

export const GameSessionError: WsError = {
  gameNotFound: { message: 'Game session not found', code: 3 },
  invalidPlayersLength: {
    message: 'Game session has invalid players length',
    code: 4,
  },
  cantJoinTwice: { message: 'Cant join same player twice', code: 5 },
  playerNotFound: {
    message: 'Player cant be found inside game session',
    code: 6,
  },
};
