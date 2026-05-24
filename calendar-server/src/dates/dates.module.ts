import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Date } from './entities/date.entity';
import { DatesService } from './dates.service';
import { DatesController } from './dates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Date])],
  providers: [DatesService],
  controllers: [DatesController],
  exports: [DatesService],
})
export class DatesModule {}