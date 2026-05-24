import { Module } from '@nestjs/common';
import { CheckerService } from './checker.service';
import { CheckerController } from './checker.controller';

@Module({
  controllers: [CheckerController],
  providers: [CheckerService],
})
export class CheckerModule {}
