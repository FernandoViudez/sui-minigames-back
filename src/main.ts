/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
import { environment } from './environment/environment';
require('events').EventEmitter.defaultMaxListeners =
  environment.sockets.maxListeners;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validationPipeConfig } from './_config/validation-pipe.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(validationPipeConfig);
  app.enableCors();
  await app.listen(environment.port);
}
bootstrap();
