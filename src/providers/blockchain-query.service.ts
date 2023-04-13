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

  /**
   * Retry function. Waits for a SUI node. Should be used in case you want to validate some information against blockchain.
   * @param cb must return the required response or must throw an error in case of incorrect response. Required response type must be specified as T
   */
  async retry<T>(
    cb: (...args: any[]) => any,
    args: any[],
    throwError = true,
    retryAmount: number = environment.sui.maxRetry,
  ): Promise<T | false> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      return await cb(...args);
    } catch (error) {
      if (retryAmount == 0 && throwError) {
        throw error;
      } else if (retryAmount == 0) {
        return false;
      }
    }
    return await this.retry(cb, args, throwError, retryAmount - 1);
  }

  async getObject<T>(objectId: string): Promise<T> {
    try {
      const res = await this.provider.getObject({
        id: objectId,
        options: {
          showContent: true,
        },
      });
      return (res.data.content as any).fields as T;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
