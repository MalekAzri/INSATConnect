import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { CalendarWebhookController } from '../calendar/calendar-webhook.controller';
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [
    NotificationsController,
    CalendarWebhookController,
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}