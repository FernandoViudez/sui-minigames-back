/* eslint-disable prettier/prettier */
import { BadRequestException, UsePipes } from '@nestjs/common';
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
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GeneralError } from '../errors/general.error';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { UseFilters } from '@nestjs/common/decorators';
import { Namespace } from '../../_type/socket-namespaces.type';
import { RoomService } from './room.service';
import { GameSessionService } from './game-session.service';
import { PlayerService } from './player.service';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class CreateRoomGateway {
  constructor(
    private readonly roomService: RoomService,
    private readonly gameSessionService: GameSessionService,
    private readonly playerService: PlayerService,
  ) {}
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
    await this.playerService.saveNewPlayer(roomId, client.id, sender, 1);
    await this.gameSessionService.saveNewGame(
      data.gameBoardObjectId,
      client.id,
      roomId,
    );
    if (!data.isPrivate) {
      await this.roomService.addRoom({
        code: roomId + ':' + data.gameBoardObjectId,
        id: roomId,
        owner: sender,
        status: 'waiting',
      });
    }

    client.join(roomId);
    client.emit('room-created', {
      roomId,
    });
  }
}
