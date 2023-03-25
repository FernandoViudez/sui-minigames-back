import { Ed25519Keypair, RawSigner } from '@mysten/sui.js';
import { Injectable } from '@nestjs/common';
import { environment } from '../../environment/environment';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { CardId } from '../interface/card.interface';

@Injectable()
export class MemotestContractService {
  private packageObjectId = environment.memotest.packageObjectId;
  private keypair = Ed25519Keypair.deriveKeypair(
    environment.memotest.authorized_addr,
    "m/44'/784'/0'/0'/0'",
  );
  private signer: RawSigner;
  constructor(private readonly blockchainQueryService: BlockchainQueryService) {
    this.signer = new RawSigner(this.keypair, blockchainQueryService.provider);
  }

  async updateCard(
    gameBoardObjectId: string,
    cardId: CardId,
    newLocation: number,
    modifyPer: boolean,
    newImage: string,
  ) {
    await this.signer.executeMoveCall({
      packageObjectId: environment.memotest.packageObjectId,
      function: 'update_card',
      module: 'memotest',
      typeArguments: [],
      arguments: [
        environment.memotest.configObjectId,
        gameBoardObjectId,
        cardId,
        newLocation,
        modifyPer,
        newImage,
      ],
    });
  }
}
