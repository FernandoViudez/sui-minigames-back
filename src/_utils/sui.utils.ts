import {
  fromB64,
  fromSerializedSignature,
  Ed25519PublicKey,
} from '@mysten/sui.js';
import * as tweetnacl from 'tweetnacl';

export const SuiUtils = {
  signature: {
    parseSerializedSignature: (signature: string) => {
      return fromSerializedSignature(signature);
    },
  },
  sockets: {
    verifySocketSignature: async (
      signatureB64: string,
      publicKeyB64: string,
      socketId: string,
    ) => {
      try {
        const publicKey = new Ed25519PublicKey(
          Buffer.from(publicKeyB64, 'base64'),
        );
        const address = publicKey.toSuiAddress();
        const messageBytes = new TextEncoder().encode(address + ':' + socketId);
        const isValid = tweetnacl.sign.detached.verify(
          messageBytes,
          fromB64(signatureB64),
          publicKey.toBytes(),
        );
        if (isValid) {
          return address;
        }
        return false;
      } catch (error) {
        return false;
      }
    },
  },
};
