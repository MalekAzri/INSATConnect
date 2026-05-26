import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { HomeworkReminderService } from './homework-reminder.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../admin-agent/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TeacherController],
  providers: [TeacherService, HomeworkReminderService, PrismaService],
})
export class TeacherModule {}
