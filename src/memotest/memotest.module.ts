import { CacheModule, Module } from '@nestjs/common';
import { CreateRoomGateway } from './providers/create-room.service';
import { JoinRoomGateway } from './providers/join-room.service';
import { StartGameGateway } from './providers/start-game.service';
import { TurnOverCardGateway } from './providers/turn-over-card.service';
import { MemotestContractService } from './providers/memotest-contract.service';
import { BlockchainQueryService } from '../providers/blockchain-query.service';

@Module({
  imports: [CacheModule.register()],
  providers: [
    CreateRoomGateway,
    JoinRoomGateway,
    StartGameGateway,
    TurnOverCardGateway,
    MemotestContractService,
    BlockchainQueryService,
  ],
})
export class MemotestModule {}
