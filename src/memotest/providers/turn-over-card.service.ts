/* eslint-disable prettier/prettier */
import {
  InternalServerErrorException,
  UseFilters,
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
import { GameSession } from '../type/game-session.type';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { TurnOverCardDto } from '../dto/turn-over-card.dto';
import { Card } from '../interface/card.interface';
import { memotestConstants } from '../constants/constants';
import { MemotestContractService } from './memotest-contract.service';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GeneralError } from '../errors/general.error';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { Namespace } from '../../_type/socket-namespaces.type';
import { PlayerService } from './player.service';
import { GameSessionService } from './game-session.service';
@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class TurnOverCardGateway {
  @WebSocketServer()
  private server: Server;
  constructor(
    private readonly blockchainQueryService: BlockchainQueryService,
    private readonly memotestContractService: MemotestContractService,
    private readonly playerService: PlayerService,
    private readonly gameSessionService: GameSessionService,
  ) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('turn-over-card')
  async onTurnOverCard(
    @MessageBody() data: TurnOverCardDto,
    @ConnectedSocket() client: Socket,
  ) {
    const player = await this.playerService.getPlayerFromSocket(client.id);
    const gameSession: GameSession =
      await this.gameSessionService.getGameSessionFromRoomId(player.roomId);

    if (
      !(await this.gameSessionService.canFlipCard(player.roomId, data.position))
    ) {
      throw new InternalServerErrorException('You cant flip the card');
    }

    await this.gameSessionService.flipCard(
      player.roomId,
      {
        position: data.position,
      },
      player.id,
    );

    const gameBoard = await this.blockchainQueryService.getObject<GameBoard>(
      gameSession.gameBoardObjectId,
    );

    let currentCard = this.getCardFromPosition(gameBoard, data.position);

    if (!currentCard) {
      currentCard = this.selectRandomCard(gameBoard.cards);
      if (!currentCard.fields.image) {
        const image = await this.gameSessionService.getRandomImage(
          player.roomId,
        );
        currentCard.fields.image = image;
      }
      try {
        await this.memotestContractService.updateCard(
          gameSession.gameBoardObjectId,
          currentCard.fields.id,
          data.position,
          currentCard.fields.location != 0,
          currentCard.fields.image,
          player.id,
        );
      } catch (error) {
        console.log(error);
        return await this.handleUpdateCardError(
          player.roomId,
          currentCard.fields.image,
        );
      }
    } else {
      this.server.to(player.roomId).emit('card-turned-over', {
        id: currentCard.fields.id,
        position: data.position,
        image: currentCard.fields.image,
      });
    }

    if (gameSession.currentTurn.cards.length == 2) {
      console.log('subscribing...');
      const subscriptionId = await this.blockchainQueryService.on(
        'TurnChanged',
        async () => {
          console.log('TurnChanged emitted');
          await this.blockchainQueryService.unsubscribe(subscriptionId);
          await this.gameSessionService.updateTurn(player.roomId);
        },
      );
    }
  }

  private async handleUpdateCardError(roomId: string, imageSelected: string) {
    await this.gameSessionService.unFlipCard(roomId, imageSelected);
    throw new InternalServerErrorException(
      GeneralError.internalSuiErrorUpdatingCard,
    );
  }

  @SubscribeMessage('request-time-out')
  async requestChangeTurn(@ConnectedSocket() client: Socket) {
    // get time from blockchain
    // if date.now - timeFromBlockchain >= turnTimePerPlayer => can update
    // game session -> updateTurn()
    // otherwise, ignore
  }

  private getCardFromPosition(gameBoard: GameBoard, position: number) {
    const currentCard = gameBoard.cards.find(
      (card) =>
        card.fields.location == position ||
        card.fields.per_location == position,
    );
    return currentCard;
  }

  private selectRandomCard(cards: { fields: Card }[]) {
    const unassignedCards = cards.filter(
      (card) =>
        card.fields.found_by == memotestConstants.zero_address &&
        (!card.fields.location || !card.fields.per_location),
    );
    return unassignedCards[Math.floor(Math.random() * unassignedCards.length)];
  }
}
