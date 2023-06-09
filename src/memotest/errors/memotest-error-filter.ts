import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class MemotestExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    try {
      super.catch(
        new WsException({
          ...(exception.getResponse() as object),
        }),
        host,
      );
    } catch (error) {
      console.log(exception, error);
    }
  }
}
