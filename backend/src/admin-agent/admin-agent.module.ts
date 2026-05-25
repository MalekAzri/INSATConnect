import { Module } from '@nestjs/common';
import { CalendarModule } from './calendar/calendar.module';
import { GradesModule } from './grades/grades.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PublicationsModule } from './publications/publications.module';

@Module({
  imports: [NotificationsModule, PublicationsModule, CalendarModule, GradesModule],
})
export class AdminAgentModule {}
