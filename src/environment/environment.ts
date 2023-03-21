export const environment = {
  port: Number(process.env.PORT),
  sui: {
    deployer: JSON.parse(process.env.SUI_DEPLOYER || '{}'),
    authorized_addr: JSON.parse(process.env.SUI_AUTHORIZED_ADDRESS || '{}'),
  },
  sockets: {
    port: Number(process.env.GATEWAY_PORT),
  },
  memotest: {
    cards: JSON.parse(process.env.MEMOTEST_CARDS_IMAGE || '[]'),
  },
};
