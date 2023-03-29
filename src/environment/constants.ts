import { GatewayMetadata } from '@nestjs/websockets';

export const constants = {
  socketConfig: {
    cors: '*',
  } as GatewayMetadata,
};
Object.freeze(constants);
