export const environment = {
  port: Number(process.env.PORT),
  sui: {
    rcp: process.env.RCP,
    faucet: process.env.FAUCET,
  },
  sockets: {
    port: Number(process.env.GATEWAY_PORT),
  },
  memotest: {
    cardsImage: JSON.parse(process.env.MEMOTEST_CARDS_IMAGE || '[]'),
    authorized_addr: process.env.SUI_AUTHORIZED_ADDRESS,
    packageObjectId: process.env.PACKAGE_OBJECT_ID,
    configObjectId: process.env.CONFIG_OBJECT_ID,
  },
};
