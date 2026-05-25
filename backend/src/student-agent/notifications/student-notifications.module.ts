import { Module } from '@nestjs/common';
import { StudentNotificationsController } from './student-notifications.controller';

@Module({
  controllers: [StudentNotificationsController],
})
export class StudentNotificationsModule {}
