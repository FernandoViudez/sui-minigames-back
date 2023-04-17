export interface Room {
  id: string;
  code: string;
  owner: string;
  status: string;
  isPrivate: boolean;
}

export interface RoomResponse extends Room {
  playersInRoom: number;
}
