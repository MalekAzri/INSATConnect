import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../admin-agent/notifications/notifications.service';
import { NotificationRole } from '../admin-agent/common/enums/notification-role.enum';

@Injectable()
export class HomeworkReminderService {
  private readonly logger = new Logger(HomeworkReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDeadlines() {
    const now = new Date();
    const in3days = new Date(now);
    in3days.setDate(in3days.getDate() + 3);

    const homeworks = await this.prisma.homework.findMany({
      where: {
        deadline: { gte: now, lte: in3days },
      },
      include: { room: true },
    });

    for (const hw of homeworks) {
      const daysLeft = Math.ceil((hw.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      await this.notificationsService.publish({
        type: 'homework.deadline.reminder',
        message: `Rappel : le devoir "${hw.title}" est à remettre dans ${daysLeft} jour(s)`,
        role: NotificationRole.STUDENT,
        targetYear: hw.room.targetYear,
        data: { homeworkId: hw.id, title: hw.title, deadline: hw.deadline.toISOString(), daysLeft },
      });
      this.logger.log(`Rappel devoir envoyé : ${hw.title} (${hw.room.targetYear}) J-${daysLeft}`);
    }
  }
}
