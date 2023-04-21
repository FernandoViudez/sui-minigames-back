import { WsError } from '../../_type/ws-error.type';

export const GeneralError: WsError = {
  invalidSignature: { message: 'Invalid signature provided', code: 1 },
  positionAlreadyChosenInSameTurn: {
    message: 'You cant turn over the same card twice',
    code: 2,
  },
  cantTurnOver: {
    message: 'You cant turn over three cards',
    code: 23,
  },
  internalSuiErrorUpdatingCard: {
    message: 'Internal SUI error, please try to flip the card again.',
    code: 25,
  },
};
