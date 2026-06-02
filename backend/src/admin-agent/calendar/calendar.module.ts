import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarSyncService } from './calendar-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarSyncService],
  exports: [CalendarService],
})
export class CalendarModule {}
