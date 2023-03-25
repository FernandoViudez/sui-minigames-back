import { Connection, JsonRpcProvider } from '@mysten/sui.js';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { environment } from '../environment/environment';

@Injectable()
export class BlockchainQueryService {
  private suiProvider = new JsonRpcProvider(
    new Connection({
      faucet: environment.sui.faucet,
      fullnode: environment.sui.rcp,
    }),
  );

  get provider() {
    return this.suiProvider;
  }

  async getObject<T>(objectId: string): Promise<T> {
    try {
      const res = await this.provider.getObject(objectId);
      console.log(res);
      return res as T;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
