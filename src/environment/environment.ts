export const environment = {
  port: Number(process.env.PORT),
  sui: {
    rcp: process.env.RCP,
    faucet: process.env.FAUCET,
    maxRetry: Number(process.env.MAX_RETRY) || 0,
  },
  sockets: {
    port: Number(process.env.GATEWAY_PORT),
    maxListeners: Number(process.env.MAX_SOCKET_LISTENERS),
  },
  memotest: {
    cardsImage: JSON.parse(process.env.MEMOTEST_CARDS_IMAGE || '[]'),
    authorized_addr: process.env.SUI_AUTHORIZED_ADDRESS,
    packageObjectId: process.env.PACKAGE_OBJECT_ID,
    configObjectId: process.env.CONFIG_OBJECT_ID,
    matchDuration: Number(process.env.MATCH_DURATION),
    playerTurnDuration: Number(process.env.PLAYER_TURN_DURATION),
  },
};
