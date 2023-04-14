/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  UsePipes,
  UnauthorizedException,
  UseFilters,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { environment } from '../../environment/environment';
import { SuiUtils } from '../../_utils/sui.utils';
import { JoinRoomDto } from '../dto/join-room.dto';
import { Cache } from 'cache-manager';
import { GameSession } from '../type/game-session.type';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { GameBoard } from '../interface/game-board.interface';
import { validationPipeConfig } from '../../_config/validation-pipe.config';
import { constants } from '../../environment/constants';
import { GeneralError } from '../errors/general.error';
import { GameSessionError } from '../errors/game-session.error';
import { GameBoardError } from '../errors/game-board.error';
import { MemotestExceptionsFilter } from '../errors/memotest-error-filter';
import { Player } from '../interface/player.interface';
import { Namespace } from '../../_type/socket-namespaces.type';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class JoinRoomGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly blockchainQueryService: BlockchainQueryService,
  ) {}
  @UsePipes(validationPipeConfig)
  @SubscribeMessage('join')
  async onJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const sender = await SuiUtils.sockets.verifySocketSignature(
      data.signature,
      data.publicKey,
      client.id,
    );
    if (!sender) {
      throw new BadRequestException(GeneralError.invalidSignature);
    }
    const gameSession: GameSession = JSON.parse(
      await this.cacheManager.get(data.roomId),
    );
    if (!gameSession) {
      throw new BadRequestException(GameSessionError.gameNotFound);
    }
    if (gameSession.players.length >= 4) {
      throw new BadRequestException(GameSessionError.invalidPlayersLength);
    }
    const alreadyJoined = gameSession.players.find(
      (player) => player.address == sender,
    );
    if (alreadyJoined) {
      throw new BadRequestException(GameSessionError.cantJoinTwice);
    }
    let player: any;
    try {
      player = (await this.checkPlayerOnChain(
        sender,
        gameSession.gameBoardObjectId,
      )) as { fields: Player };
    } catch (error) {
      player = await this.blockchainQueryService.retry<{ fields: Player }>(
        this.checkPlayerOnChain.bind(this),
        [sender, gameSession.gameBoardObjectId],
      );
    }
    gameSession.players.push({
      address: sender,
      id: player.fields.id,
      socketId: client.id,
    });
    await this.cacheManager.set(data.roomId, JSON.stringify(gameSession));
    await this.cacheManager.set(client.id, data.roomId);
    client.join(data.roomId);
    this.server.to(data.roomId).emit('player-joined', {
      id: player.fields.id,
    });
  }

  private async checkPlayerOnChain(
    sender: string,
    gameBoardObjectId: string,
  ): Promise<{ fields: Player } | false> {
    const gameBoard = await this.blockchainQueryService.getObject<GameBoard>(
      gameBoardObjectId,
    );
    const player = gameBoard.players.find(
      (player) => player.fields.addr == sender,
    );
    if (!player) {
      throw new UnauthorizedException(GameBoardError.playerNotFound);
    }
    return player;
  }
}
