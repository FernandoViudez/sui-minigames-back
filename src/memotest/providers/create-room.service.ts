/* eslint-disable prettier/prettier */
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { environment } from '../../environment/environment';
import { CreateRoomDto } from '../types/create-room.type';

@WebSocketGateway(environment.sockets.port)
export class CreateRoomGateway {
  @SubscribeMessage('create')
  onCreateRoom(@MessageBody() data: CreateRoomDto): void {
    console.log(data);
  }
}
