import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { AcademicCalendarConfig } from './entities/academic-calendar.entity';
import { CalendarSyncService } from './calendar-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicCalendarConfig])],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarSyncService],
  exports: [CalendarService],
})
export class CalendarModule {}
