/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { environment } from '../../environment/environment';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { TurnOverCardDto } from '../dto/turn-over-card.dto';
import { Card, CardId } from '../interface/card.interface';
import { memotestConstants } from '../constants/constants';
import { MemotestContractService } from './memotest-contract.service';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GameSessionError } from '../errors/game-session.error';
import { GameBoardError } from '../errors/game-board.error';
import { GeneralError } from '../errors/general.error';

@WebSocketGateway(environment.sockets.port, constants.socketConfig)
export class TurnOverCardGateway {
  @WebSocketServer()
  private server: Server;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly blockchainQueryService: BlockchainQueryService,
    private readonly memotestContractService: MemotestContractService,
  ) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('turn-over-card')
  async onTurnOverCard(
    @MessageBody() data: TurnOverCardDto,
    @ConnectedSocket() client: Socket,
  ) {
    const gameSession: GameSession = JSON.parse(
      await this.cacheManager.get(data.roomId),
    );
    if (!gameSession) {
      throw new BadRequestException(GameSessionError.gameNotFound);
    }

    const gameBoard = await this.blockchainQueryService.getObject<GameBoard>(
      gameSession.gameBoardObjectId,
    );

    const sender = gameSession.players.find(
      (player) => player.socketId == client.id,
    );
    if (gameBoard.who_plays != sender.id) {
      throw new UnauthorizedException(GameBoardError.incorrectTurn);
    }

    let currentCard = gameBoard.cards.find(
      (card) =>
        card.fields.location == data.position ||
        card.fields.per_location == data.position,
    );

    if (
      gameSession.currentTurn.cardsTurnedOver.length == 1 &&
      gameSession.currentTurn.cardsTurnedOver[0].position == data.position
    ) {
      throw new BadRequestException(
        GeneralError.positionAlreadyChosenInSameTurn,
      );
    }

    if (!currentCard) {
      currentCard = this.selectRandomCard(gameBoard.cards);
      const { image, cards } = this.assignImage(gameSession.cardsImage);
      currentCard.fields.image = image;
      gameSession.cardsImage = cards;
      await this.updateCardOnChain(
        gameSession.gameBoardObjectId,
        currentCard.fields.id,
        data.position,
        currentCard.fields.location != 0,
        image,
      );
    }

    this.server.to(data.roomId).emit('card-turned-over', {
      id: currentCard.fields.id,
      position: data.position,
      image: currentCard.fields.image,
    });
    client.emit('card-selected', {
      id: currentCard.fields.id,
      position: data.position,
      image: currentCard.fields.image,
    });

    if (!gameSession.currentTurn.cardsTurnedOver.length) {
      gameSession.currentTurn.cardsTurnedOver = [
        {
          id: currentCard.fields.id,
          position: data.position,
        },
      ];
    } else {
      gameSession.currentTurn.cardsTurnedOver = [];
      this.server.to(data.roomId).emit('turn-changed');
    }

    await this.cacheManager.set(data.roomId, JSON.stringify(gameSession));
  }

  private selectRandomCard(cards: { fields: Card }[]) {
    const unassignedCards = cards.filter(
      (card) =>
        card.fields.found_by == memotestConstants.zero_address &&
        (!card.fields.location || !card.fields.per_location),
    );
    return unassignedCards[Math.floor(Math.random() * unassignedCards.length)];
  }

  private assignImage(cardsFromSession: string[]) {
    const idx = Math.floor(Math.random() * cardsFromSession.length);
    const image = cardsFromSession[idx];
    cardsFromSession.splice(idx, 1);
    return {
      image,
      cards: cardsFromSession,
    };
  }

  private async updateCardOnChain(
    gameBoardObjectId: string,
    cardId: CardId,
    position: number,
    modify_per: boolean,
    image: string,
  ) {
    await this.memotestContractService.updateCard(
      gameBoardObjectId,
      cardId,
      position,
      modify_per,
      image,
    );
  }
}
