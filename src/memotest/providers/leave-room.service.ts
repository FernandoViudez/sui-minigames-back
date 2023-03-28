/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UsePipes,
} from '@nestjs/common';
import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { environment } from '../../environment/environment';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { validationPipeConfig } from '../../_config/validation-pipe.config';

@WebSocketGateway(environment.sockets.port)
export class LeaveRoomGateway {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('disconnect')
  async onJoinRoom(@ConnectedSocket() client: Socket) {
    const roomId: string = await this.cacheManager.get(client.id);
    const gameSession: GameSession = JSON.parse(
      await this.cacheManager.get(roomId),
    );
    if (!gameSession) {
      throw new BadRequestException();
    }
    const idx = gameSession.players.findIndex(
      (player) => player.socketId == client.id,
    );
    if (idx < 0) {
      throw new BadRequestException();
    }
    gameSession.players.splice(idx, 1);
    await this.cacheManager.del(client.id);
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
  }
}
