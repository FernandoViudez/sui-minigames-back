/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UnauthorizedException,
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
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { TurnOverCardDto } from '../dto/turn-over-card.dto';
import { Card } from '../interface/card.interface';
import { memotestConstants } from '../constants/constants';
import { MemotestContractService } from './memotest-contract.service';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GameBoardError } from '../errors/game-board.error';
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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

    const gameBoard = (await this.blockchainQueryService.retry<GameBoard>(
      this.checkTurn,
      [gameSession, client.id],
      true,
    )) as GameBoard;

    let currentCard = this.getCardFromPosition(gameBoard, data.position);

    if (
      gameSession.playingCardPosition &&
      gameSession.playingCardPosition == data.position
    ) {
      throw new BadRequestException(
        GeneralError.positionAlreadyChosenInSameTurn,
      );
    }

    if (!currentCard) {
      currentCard = this.selectRandomCard(gameBoard.cards);
      const image = await this.gameSessionService.getRandomImage(player.roomId);
      currentCard.fields.image = image;
      await this.memotestContractService.updateCard(
        gameSession.gameBoardObjectId,
        currentCard.fields.id,
        data.position,
        currentCard.fields.location != 0,
        image,
      );
    }

    this.server.to(player.roomId).emit('card-turned-over', {
      id: currentCard.fields.id,
      position: data.position,
      image: currentCard.fields.image,
    });
    client.emit('card-selected', {
      id: currentCard.fields.id,
      position: data.position,
      image: currentCard.fields.image,
    });

    if (gameSession.playingCardPosition) {
      this.server.to(player.roomId).emit('turn-changed');
    }

    await this.gameSessionService.processPlayingCard(
      player.roomId,
      data.position,
    );
  }

  private async checkTurn(gameSession: GameSession, socketId: string) {
    const gameBoard = await this.blockchainQueryService.getObject<GameBoard>(
      gameSession.gameBoardObjectId,
    );
    this.checkCurrentTurn(gameSession.players, gameBoard.who_plays, socketId);
    return gameBoard;
  }

  private checkCurrentTurn(players: any[], whoPlays: number, socketId: string) {
    const sender = players.find((player) => player.socketId == socketId);
    if (whoPlays != sender.id) {
      throw new UnauthorizedException(GameBoardError.incorrectTurn);
    }
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
