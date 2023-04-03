export type WsError = Record<
  any,
  {
    message: string;
    code: number;
  }
>;
