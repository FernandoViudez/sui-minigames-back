/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  UnauthorizedException,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { environment } from '../../environment/environment';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GameSessionError } from '../errors/game-session.error';
import { GameBoardError } from '../errors/game-board.error';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { Socket } from 'socket.io';
import { Namespace } from '../../_type/socket-namespaces.type';
import { GameSessionService } from './game-session.service';
import { PlayerService } from './player.service';
import { RoomService } from './room.service';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class StartGameGateway {
  @WebSocketServer()
  private server: Server;
  constructor(
    private readonly blockchainQueryService: BlockchainQueryService,
    private readonly gameSessionService: GameSessionService,
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
  ) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('start-game')
  async onStartGame(@ConnectedSocket() client: Socket) {
    const player = await this.playerService.getPlayerFromSocket(client.id);
    const gameSession = await this.gameSessionService.getGameSessionFromRoomId(
      player.roomId,
    );

    if (gameSession.players.length < 2 || gameSession.players.length > 4) {
      throw new BadRequestException(GameSessionError.invalidPlayersLength);
    }

    if (player.id != 1) {
      throw new UnauthorizedException(GameSessionError.cantStartGame);
    }

    await this.blockchainQueryService.retry<true>(
      this.checkGameOnChain.bind(this),
      [gameSession.gameBoardObjectId, player.address],
    );

    await this.roomService.updateRoomStatus(player.roomId, 'playing');

    this.server.to(player.roomId).emit('game-started');
  }

  private async checkGameOnChain(gameBoardObjectId: string, creator: string) {
    const gameBoard: GameBoard = await this.blockchainQueryService.getObject(
      gameBoardObjectId,
    );
    if (gameBoard.config.fields.creator != creator) {
      throw new UnauthorizedException(GameBoardError.cantStartGame);
    }

    if (gameBoard.status != 'playing') {
      throw new BadRequestException(
        GameBoardError.invalidStatusForStartingGame,
      );
    }

    return true;
  }
}
