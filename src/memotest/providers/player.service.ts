import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameSessionError } from '../errors/game-session.error';
import { Player } from '../interface/socket/player.class';

@Injectable()
export class PlayerService {
  constructor(
    private readonly blockchainQueryService: BlockchainQueryService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  async saveNewPlayer(
    roomId: string,
    socketId: string,
    address: string,
    id: number,
  ) {
    const player = new Player(roomId, socketId, id, address);
    await this.cacheManager.set(socketId, JSON.stringify(player));
    return player;
  }

  async getPlayerFromSocket(socketId: string) {
    const playerString = await this.cacheManager.get<string | undefined>(
      socketId,
    );
    if (!playerString) {
      throw new NotFoundException(GameSessionError.playerNotFound);
    }
    const player = JSON.parse(playerString) as Player;
    return player;
  }

  async removePlayer(socketId: string) {
    const player = await this.getPlayerFromSocket(socketId);
    await this.cacheManager.del(socketId);
    return player;
  }
}
