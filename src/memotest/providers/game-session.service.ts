import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameSessionError } from '../errors/game-session.error';
import { GameSession } from '../type/game-session.type';

@Injectable()
export class GameSessionService {
  constructor(
    private readonly blockchainQueryService: BlockchainQueryService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  async saveNewGame(
    gameBoardObjectId: string,
    socketId: string,
    roomId: string,
  ) {
    const gameSession = new GameSession(gameBoardObjectId, socketId);
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
  }

  async getGameSessionFromRoomId(roomId: string) {
    const gameSessionString = await this.cacheManager.get<string | undefined>(
      roomId,
    );
    if (!gameSessionString) {
      throw new BadRequestException(GameSessionError.gameNotFound);
    }
    const gameSession = JSON.parse(gameSessionString) as GameSession;
    return gameSession;
  }

  async removePlayer(roomId: string, socketId: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const playerIdx = gameSession.players.findIndex(
      (player) => player == socketId,
    );
    if (playerIdx < 0) {
      throw new NotFoundException(GameSessionError.playerNotFound);
    }
    gameSession.players.splice(playerIdx);
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
    return gameSession;
  }

  async processPlayingCard(roomId: string, positionSent: number) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    if (!gameSession.playingCardPosition) {
      gameSession.playingCardPosition = positionSent;
    } else {
      gameSession.playingCardPosition = 0;
    }
    await this.updateGameSession(roomId, gameSession);
  }

  async getRandomImage(roomId: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const idx = Math.floor(Math.random() * gameSession.cardsImage.length);
    const image = gameSession.cardsImage[idx];
    gameSession.cardsImage.splice(idx, 1);
    await this.updateGameSession(roomId, gameSession);
    return image;
  }

  async updateGameSession(roomId: string, gameSession: GameSession) {
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
  }
}
