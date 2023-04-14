export class Player {
  roomId: string;
  socketId: string;
  id: number;
  address: string;
  constructor(roomId: string, socketId: string, id: number, address: string) {
    this.roomId = roomId;
    this.socketId = socketId;
    this.id = id;
    this.address = address;
  }
}
