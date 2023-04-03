/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UsePipes,
} from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { environment } from '../../environment/environment';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { MemotestContractService } from './memotest-contract.service';
import { GameSessionError } from '../errors/game-session.error';

@WebSocketGateway(environment.sockets.port, constants.socketConfig)
export class LeaveRoomGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly memotestContractService: MemotestContractService,
  ) {}
  @UsePipes(validationPipeConfig)
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const roomId: string = await this.cacheManager.get(client.id);
    // TODO: Refactor, should add something like "actual-game" for all sockets and execute this logic if "actual-game" == "memotest"
    if (!roomId) return;
    const gameSession: GameSession = JSON.parse(
      await this.cacheManager.get(roomId),
    );
    if (!gameSession) {
      throw new BadRequestException(GameSessionError.gameNotFound);
    }
    const idx = gameSession.players.findIndex(
      (player) => player.socketId == client.id,
    );
    if (idx < 0) {
      throw new BadRequestException(GameSessionError.playerNotFound);
    }
    const playerId = gameSession.players[idx].id;
    gameSession.players.splice(idx, 1);
    await this.cacheManager.del(client.id);
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
    await this.memotestContractService.disconnectPlayer(
      gameSession.gameBoardObjectId,
      playerId,
    );
    this.server.to(roomId).emit('player-left', { playerId });
  }
}
