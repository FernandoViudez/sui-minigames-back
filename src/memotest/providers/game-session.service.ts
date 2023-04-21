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
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
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
    if (gameSession.currentTurn.playerId == player.id) {
      await this.resetCurrentTurn(roomId);
    }
    gameSession.players.splice(playerIdx);
    await this.cacheManager.set(roomId, JSON.stringify(gameSession));
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

  async addNewImage(roomId: string, image: string) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.cardsImage.push(image);
    await this.updateGameSession(roomId, gameSession);
  }

  async setPlayer(roomId: string, playerId: number) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.currentTurn.playerId = playerId;
    await this.updateGameSession(roomId, gameSession);
  }

  async processCurrentTurn(
    roomId: string,
    card: { position: number; id: number },
    playerId: number,
  ) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const cardIdx = gameSession.currentTurn.cards.findIndex(
      (_card) => _card.position == card.position,
    );
    gameSession.currentTurn.cards[cardIdx].id = card.id;
    gameSession.currentTurn.playerId = playerId;
    await this.updateGameSession(roomId, gameSession);
  }

  async addCard(roomId: string, card: { position: number; id: number }) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.currentTurn.cards.push(card);
    await this.updateGameSession(roomId, gameSession);
  }

  async removeCardByPosition(roomId: string, position: number) {
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    const cardIdx = gameSession.currentTurn.cards.findIndex(
      (card) => card.position == position,
    );
    gameSession.currentTurn.cards.splice(cardIdx, 1);
    await this.updateGameSession(roomId, gameSession);
  }

  async resetCurrentTurn(roomId: string) {
    await this.updateGameTimeOut(roomId);
    const gameSession = await this.getGameSessionFromRoomId(roomId);
    gameSession.currentTurn.cards = [];
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
}
