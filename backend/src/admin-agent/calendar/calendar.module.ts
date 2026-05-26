import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarSyncService } from './calendar-sync.service';
import { CalendarWebhookController } from './calendar-webhook.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CalendarController, CalendarWebhookController],
  providers: [CalendarService, CalendarSyncService],
  exports: [CalendarService],
})
export class CalendarModule {}
