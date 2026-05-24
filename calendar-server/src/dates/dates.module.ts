import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicDate } from './entities/academic-date.entity';
import { DatesService } from './dates.service';
import { DatesController } from './dates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicDate])],
  providers: [DatesService],
  controllers: [DatesController],
  exports: [DatesService],
})
export class DatesModule {}