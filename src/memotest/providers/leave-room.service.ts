/* eslint-disable prettier/prettier */
import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { environment } from '../../environment/environment';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { MemotestContractService } from './memotest-contract.service';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { Namespace } from '../../_type/socket-namespaces.type';
import { PlayerService } from './player.service';
import { GameSessionService } from './game-session.service';
import { WsThrottlerGuard } from '../../providers/ws-throttler.service';

@UseGuards(WsThrottlerGuard)
@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class LeaveRoomGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly memotestContractService: MemotestContractService,
    private readonly playerService: PlayerService,
    private readonly gameSessionService: GameSessionService,
  ) {}
  @UsePipes(validationPipeConfig)
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const player = await this.playerService.removePlayer(client.id);
      const gameSession = await this.gameSessionService.removePlayer(
        player.roomId,
        player,
      );
      await this.memotestContractService.disconnectPlayer(
        gameSession.gameBoardObjectId,
        player.id,
      );
      this.server.to(player.roomId).emit('player-left', {
        id: player.id,
        address: player.address,
      });
    } catch (error) {}
  }
}
