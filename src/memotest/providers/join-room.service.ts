/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UsePipes,
  UnauthorizedException,
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
import { SuiUtils } from '../../_utils/sui.utils';
import { JoinRoomDto } from '../dto/join-room.dto';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';

@WebSocketGateway(environment.sockets.port, constants.socketConfig)
export class JoinRoomGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly blockchainQueryService: BlockchainQueryService,
  ) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('join')
  async onJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sender = await SuiUtils.sockets.verifySocketSignature(
      data.signature,
      client.id,
    );
    if (!sender) {
      throw new BadRequestException();
    }
    const gameSession: GameSession = JSON.parse(
      await this.cacheManager.get(data.roomId),
    );
    if (!gameSession) {
      throw new BadRequestException();
    }
    if (gameSession.players.length >= 4) {
      throw new BadRequestException();
    }
    const alreadyJoined = gameSession.players.find(
      (player) => player.address == sender,
    );
    if (alreadyJoined) {
      throw new BadRequestException();
    }

    const gameBoard = await this.blockchainQueryService.getObject<GameBoard>(
      gameSession.gameBoardObjectId,
    );
    const player = gameBoard.players.find(
      (player) => player.fields.addr == sender,
    );
    if (!player) {
      throw new UnauthorizedException();
    }
    gameSession.players.push({
      address: sender,
      id: player.fields.id,
      socketId: client.id,
    });
    await this.cacheManager.set(data.roomId, JSON.stringify(gameSession));
    await this.cacheManager.set(client.id, data.roomId);
    client.join(data.roomId);
    this.server.to(data.roomId).emit('player-joined', {
      id: player.fields.id,
    });
  }
}
