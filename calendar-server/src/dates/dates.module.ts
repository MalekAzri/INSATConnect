import { Module } from '@nestjs/common';
import { DatesService } from './dates.service';
import { DatesController } from './dates.controller';

@Module({
  controllers: [DatesController],
  providers: [DatesService],
})
export class DatesModule {}
