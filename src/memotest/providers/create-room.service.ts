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
import { constants } from '../../environment/constants';
import { GeneralError } from '../errors/general.error';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { UseFilters } from '@nestjs/common/decorators';
import { Namespace } from '../../_type/socket-namespaces.type';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
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
      data.publicKey,
      client.id,
    );
    if (!sender) {
      throw new BadRequestException(GeneralError.invalidSignature);
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
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
    await this.cacheManager.set('1', roomId);
    client.join(roomId);
    client.emit('room-created', {
      roomId,
    });
  }
}
