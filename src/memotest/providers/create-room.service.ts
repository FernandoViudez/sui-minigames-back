/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UsePipes,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { environment } from '../../environment/environment';
import { CreateRoomDto } from '../dto/create-room.dto';
import { Socket } from 'socket.io';
import { SuiUtils } from '../../_utils/sui.utils';
import { SocketUtils } from '../../_utils/socket.utils';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { validationPipeConfig } from '../../_config/validation-pipe.config';

@WebSocketGateway(environment.sockets.port)
export class CreateRoomGateway {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('create')
  async onCreateRoom(
    @MessageBody() data: CreateRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sender = await SuiUtils.sockets.verifySocketSignature(
      data.signature,
      client.id,
    );
    if (!sender) {
      throw new BadRequestException();
    }
    const roomId = SocketUtils.room.createRandomId();
    const gameSession = new GameSession();
    gameSession.creator = sender;
    gameSession.currentTurn = {
      cardsTurnedOver: [],
    };
    gameSession.gameBoardObjectId = data.gameBoardObjectId;
    gameSession.players = [
      {
        address: sender,
        id: 1,
        socketId: client.id,
      },
    ];
    gameSession.cardsImage = environment.memotest.cardsImage;
    this.cacheManager.set(roomId, JSON.stringify(gameSession));
    client.join(roomId);
    client.emit('room-created', {
      roomId,
    });
  }
}
