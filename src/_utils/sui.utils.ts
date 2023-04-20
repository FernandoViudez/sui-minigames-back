import {
  fromSerializedSignature,
  Ed25519PublicKey,
  messageWithIntent,
  IntentScope,
} from '@mysten/sui.js';
import * as tweetnacl from 'tweetnacl';
import { blake2b } from '@noble/hashes/blake2b';

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

        const signature = fromSerializedSignature(signatureB64);
        const message = messageWithIntent(
          IntentScope.PersonalMessage,
          messageBytes,
        );

        const isValid = tweetnacl.sign.detached.verify(
          blake2b(message, { dkLen: 32 }),
          signature.signature,
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
