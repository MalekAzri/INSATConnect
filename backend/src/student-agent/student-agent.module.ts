import { Module } from '@nestjs/common';
import { StudentNotificationsModule } from './notifications/student-notifications.module';

@Module({
  imports: [StudentNotificationsModule],
})
export class StudentAgentModule {}
