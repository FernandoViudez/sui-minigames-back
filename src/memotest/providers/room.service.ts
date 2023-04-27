import {
  CACHE_MANAGER,
  Inject,
  NotFoundException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Cache } from 'cache-manager';
import { Server } from 'socket.io';
import { constants } from '../../environment/constants';
import { environment } from '../../environment/environment';
import { WsThrottlerGuard } from '../../providers/ws-throttler.service';
import { Namespace } from '../../_type/socket-namespaces.type';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { GameBoardStatus } from '../interface/game-board.interface';
import { Room, RoomResponse } from '../interface/room.interface';
import { GameSessionService } from '../providers/game-session.service';

@UseGuards(WsThrottlerGuard)
@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class RoomService {
  @WebSocketServer()
  server: Server;
  private readonly REDIS_KEY = 'memotest-rooms';
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly gameSessionService: GameSessionService,
  ) {}

  @SubscribeMessage('get-rooms')
  async getPublicRooms(): Promise<void> {
    let rooms: Room[] = await this.getAllRooms();
    rooms = rooms.filter((room) => room.status == 'waiting' && !room.isPrivate);
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      const gameSession =
        await this.gameSessionService.getGameSessionFromRoomId(room.id);
      rooms[i] = {
        ...room,
        playersInRoom: gameSession.players.length,
      } as RoomResponse;
    }
    this.server.emit('rooms', JSON.stringify(rooms));
  }

  private async getAllRooms(): Promise<Room[]> {
    let rooms = await this.cacheManager.get<string | undefined>(this.REDIS_KEY);
    if (!rooms) {
      rooms = '[]';
    }
    return JSON.parse(rooms);
  }

  async getRoomById(roomId: string): Promise<{ room: Room; idx: number }> {
    const rooms: Room[] = await this.getAllRooms();
    const idx = rooms.findIndex((room) => room.id == roomId);
    if (idx < 0) {
      throw new NotFoundException('Room not found');
    }
    return {
      room: rooms[idx],
      idx,
    };
  }

  async addRoom(room: Room) {
    const rooms = await this.getAllRooms();
    rooms.push(room);
    await this.cacheManager.set(this.REDIS_KEY, JSON.stringify(rooms));
    if (!room.isPrivate) {
      await this.getPublicRooms();
    }
  }

  async updateRoomStatus(roomId: string, newStatus: GameBoardStatus) {
    const { room, idx } = await this.getRoomById(roomId);
    room.status = newStatus;
    await this.updateRoom(room, idx);
  }

  private async updateRoom(room: Room, idx: number) {
    const rooms = await this.getAllRooms();
    rooms[idx] = room;
    await this.cacheManager.set(this.REDIS_KEY, JSON.stringify(rooms));
    if (!room.isPrivate) {
      await this.getPublicRooms();
    }
  }
}
