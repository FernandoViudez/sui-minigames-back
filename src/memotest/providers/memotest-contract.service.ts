import { Ed25519Keypair, RawSigner, TransactionBlock } from '@mysten/sui.js';
import { Injectable } from '@nestjs/common';
import { environment } from '../../environment/environment';
import { BlockchainQueryService } from '../../providers/blockchain-query.service';
import { CardId } from '../interface/card.interface';

@Injectable()
export class MemotestContractService {
  private keypair = Ed25519Keypair.deriveKeypair(
    environment.memotest.authorized_addr,
    "m/44'/784'/0'/0'/0'",
  );
  private signer: RawSigner;
  constructor(private readonly blockchainQueryService: BlockchainQueryService) {
    this.signer = new RawSigner(this.keypair, blockchainQueryService.provider);
  }

  private async setBudget() {
    const totBalance = await this.blockchainQueryService.getBalanceFromAddress(
      this.keypair.getPublicKey().toSuiAddress(),
    );
    return Number(totBalance) - 100000;
  }

  async updateCard(
    gameBoardObjectId: string,
    cardId: CardId,
    newLocation: number,
    modifyPer: boolean,
    newImage: string,
  ) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${environment.memotest.packageObjectId}::memotest::update_card`,
      arguments: [
        tx.pure(environment.memotest.configObjectId),
        tx.pure(gameBoardObjectId),
        tx.pure(cardId),
        tx.pure(newLocation),
        tx.pure(modifyPer),
        tx.pure(newImage),
      ],
    });
    tx.setGasBudget(await this.setBudget());
    await this.signer.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
  }

  async disconnectPlayer(gameBoardObjectId: string, playerId: number) {
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${environment.memotest.packageObjectId}::memotest::disconnect_player`,
      arguments: [tx.pure(gameBoardObjectId), tx.pure(playerId)],
    });
    tx.setGasBudget(await this.setBudget());
    await this.signer.signAndExecuteTransactionBlock({ transactionBlock: tx });
  }
}
