/* eslint-disable prettier/prettier */
import {
  BadRequestException,
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
import { PlayerService } from './player.service';
import { GameSessionService } from './game-session.service';

@UseFilters(MemotestExceptionsFilter)
@WebSocketGateway(environment.sockets.port, {
  ...constants.socketConfig,
  namespace: Namespace.memotest,
})
export class JoinRoomGateway {
  @WebSocketServer()
  server: Server;
  constructor(
    private readonly blockchainQueryService: BlockchainQueryService,
    private readonly gameSessionService: GameSessionService,
    private readonly playerService: PlayerService,
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

    const gameSession: GameSession =
      await this.gameSessionService.getGameSessionFromRoomId(data.roomId);

    if (gameSession.players.length >= 4) {
      throw new BadRequestException(GameSessionError.invalidPlayersLength);
    }

    const alreadyJoined = gameSession.players.find(
      (player) => player == client.id,
    );

    if (alreadyJoined) {
      throw new BadRequestException(GameSessionError.cantJoinTwice);
    }

    const player = (await this.blockchainQueryService.retry<{ fields: Player }>(
      this.checkPlayerOnChain.bind(this),
      [sender, gameSession.gameBoardObjectId],
    )) as { fields: Player };

    await this.playerService.saveNewPlayer(
      data.roomId,
      client.id,
      sender,
      player.fields.id,
    );
    await this.gameSessionService.addPlayer(client.id, data.roomId);

    client.join(data.roomId);
    this.server.to(data.roomId).emit('player-joined', {
      id: player.fields.id,
      address: player.fields.addr,
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
      (player) => player.fields.addr == sender && player.fields.can_play,
    );
    if (!player) {
      throw new UnauthorizedException(GameBoardError.playerNotFound);
    }
    return player;
  }
}
