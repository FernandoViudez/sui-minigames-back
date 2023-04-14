import {
  CACHE_MANAGER,
  Inject,
  NotFoundException,
  UseFilters,
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
import { Namespace } from '../../_type/socket-namespaces.type';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { GameBoardStatus } from '../interface/game-board.interface';
import { Room } from '../interface/room.interface';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class RoomService {
  @WebSocketServer()
  server: Server;
  private readonly REDIS_KEY = 'memotest-rooms';
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  @SubscribeMessage('get-rooms')
  async getPublicRooms(): Promise<void> {
    const rooms: Room[] = await this.getAllRooms();
    this.server.emit(
      'rooms',
      JSON.stringify(rooms.filter((room) => room.status == 'waiting')),
    );
  }

  private async getAllRooms(): Promise<Room[]> {
    const rooms: Room[] = JSON.parse(
      await this.cacheManager.get(this.REDIS_KEY),
    );
    return rooms;
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
    let rooms = await this.getAllRooms();
    if (!rooms) {
      rooms = [];
    }
    rooms.push(room);
    await this.cacheManager.set(this.REDIS_KEY, JSON.stringify(rooms));
    await this.getPublicRooms();
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
    await this.getPublicRooms();
  }
}
