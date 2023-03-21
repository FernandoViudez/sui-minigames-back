import { CacheModule, Module } from '@nestjs/common';
import { CreateRoomGateway } from './providers/create-room.service';
import { JoinRoomGateway } from './providers/join-room.service';

@Module({
  imports: [CacheModule.register()],
  providers: [CreateRoomGateway, JoinRoomGateway],
})
export class MemotestModule {}
