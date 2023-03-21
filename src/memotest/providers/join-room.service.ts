/* eslint-disable prettier/prettier */
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { environment } from '../../environment/environment';

@WebSocketGateway(environment.sockets.port)
export class JoinRoomGateway {
  @SubscribeMessage('join')
  onEvent(@MessageBody() data: unknown): void {
    console.log('[join] ', data);
    console.log(typeof data);
  }
}
