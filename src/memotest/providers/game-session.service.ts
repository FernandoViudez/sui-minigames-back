import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { GameSessionError } from '../errors/game-session.error';
import { GameSession } from '../type/game-session.type';
import { Player } from '../type/player.class';

@Injectable()
export class GameSessionService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async saveNewGame(
    gameBoardObjectId: string,
    socketId: string,
    roomId: string,
  ) {
    const gameSession = new GameSession(gameBoardObjectId, socketId);
    await this.updateGameSession(roomId, gameSession);
  }

  async addPlayer(socketId: string, roomId: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.players.push(socketId);
    await this.updateGameSession(roomId, gameSession);
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

  async removePlayer(roomId: string, player: Player) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const playerIdx = gameSession.players.findIndex(
      (playerSocket) => playerSocket == player.socketId,
    );
    if (playerIdx < 0) {
      throw new NotFoundException(GameSessionError.playerNotFound);
    }
    gameSession.players.splice(playerIdx);
    await this.updateGameSession(roomId, gameSession);
    if (gameSession.currentTurn.playerId == player.id) {
      await this.updateTurn(roomId);
    }
    return gameSession;
  }

  async getRandomImage(roomId: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const idx = Math.floor(Math.random() * gameSession.cardsImage.length);
    const image = gameSession.cardsImage[idx];
    gameSession.cardsImage.splice(idx, 1);
    await this.updateGameSession(roomId, gameSession);
    return image;
  }

  async setPlayer(roomId: string, playerId: number) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.currentTurn.playerId = playerId;
    await this.updateGameSession(roomId, gameSession);
  }

  async updateGameTimeOut(roomId: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.lastTurnDate = Date.now();
    await this.updateGameSession(roomId, gameSession);
  }

  async updateGameSession(roomId: string, gameSession: GameSession) {
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
  }

  async updateTurn(roomId: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.currentTurn.cards = [];
    await this.updateGameSession(roomId, gameSession);
  }

  async flipCard(roomId: string, card: { position: number }, playerId: number) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.currentTurn.cards.push(card);
    gameSession.currentTurn.playerId = playerId;
    await this.updateGameSession(roomId, gameSession);
  }

  async canFlipCard(roomId: string, positionSent: number): Promise<boolean> {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    if (
      gameSession.currentTurn.cards.length &&
      gameSession.currentTurn.cards.length >= 2
    ) {
      return false;
    }
    if (
      gameSession.currentTurn.cards.length &&
      gameSession.currentTurn.cards[0].position == positionSent
    ) {
      return false;
    }
    return true;
  }

  async unFlipCard(
    roomId: string,
    cardPosition: number,
    image: string | undefined,
  ) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const idx = gameSession.currentTurn.cards.findIndex(
      (card) => card.position == cardPosition,
    );
    gameSession.currentTurn.cards.splice(idx, 1);
    if (image) {
      gameSession.cardsImage.push(image);
    }
    await this.updateGameSession(roomId, gameSession);
  }
}
