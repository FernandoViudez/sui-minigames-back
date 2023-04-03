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
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { environment } from '../../environment/environment';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { StartGameDto } from '../dto/start-game.dto';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GameSessionError } from '../errors/game-session.error';
import { GameBoardError } from '../errors/game-board.error';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, constants.socketConfig)
export class StartGameGateway {
  @WebSocketServer()
  private server: Server;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly blockchainQueryService: BlockchainQueryService,
  ) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('start-game')
  async onStartGame(@MessageBody() data: StartGameDto) {
    const gameSession: GameSession = JSON.parse(
      await this.cacheManager.get(data.roomId),
    );
    if (!gameSession) {
      throw new BadRequestException(GameSessionError.gameNotFound);
    }
    if (gameSession.players.length < 2 || gameSession.players.length > 4) {
      throw new BadRequestException(GameSessionError.invalidPlayersLength);
    }
    const gameBoard: GameBoard = await this.blockchainQueryService.getObject(
      gameSession.gameBoardObjectId,
    );
    if (gameBoard.config.fields.creator != gameSession.creator) {
      throw new UnauthorizedException(GameBoardError.cantStartGame);
    }

    if (gameBoard.status != 'playing') {
      throw new BadRequestException(
        GameBoardError.invalidStatusForStartingGame,
      );
    }

    this.server.to(data.roomId).emit('game-started');
  }
}
