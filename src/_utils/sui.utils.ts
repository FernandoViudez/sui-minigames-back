import { fromSerializedSignature } from '@mysten/sui.js';
import { verify } from '@noble/ed25519';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const blake2b = require('blake2b');

export const SuiUtils = {
  signature: {
    parseSerializedSignature: (signature: string) => {
      return fromSerializedSignature(signature);
    },
    verify: async (signature: Uint8Array, data: any, publicKey: Uint8Array) => {
      return await verify(signature, data, publicKey);
    },
  },
  sockets: {
    verifySocketSignature: async (signatureB64: string, socketId: string) => {
      const { pubKey, signature } =
        SuiUtils.signature.parseSerializedSignature(signatureB64);
      const address = pubKey.toSuiAddress();
      const dataToCheck = new Uint8Array(
        Buffer.from(address + ':' + socketId, 'utf8'),
      );
      const hash = blake2b(32).update(dataToCheck).digest();
      const isValid = await SuiUtils.signature.verify(
        signature,
        hash,
        pubKey.toBytes(),
      );
      if (isValid) {
        return address;
      }
      return false;
    },
  },
};
