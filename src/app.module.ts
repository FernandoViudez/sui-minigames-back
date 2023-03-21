import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MemotestModule } from './memotest/memotest.module';

@Module({
  imports: [MemotestModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
