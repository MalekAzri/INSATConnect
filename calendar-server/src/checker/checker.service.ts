import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook/webhook.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 7 * * *')
  async checkDeadlines(): Promise<void> {
    this.logger.log('Verification des echeances...');

    const alertDaysEnv = this.config.get<string>('ALERT_DAYS_BEFORE');
    const alertDays = Number.isFinite(Number(alertDaysEnv))
      ? Number(alertDaysEnv)
      : 3;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = await this.prisma.academicDate.findMany({
      where: { notificationSent: false },
    });

    for (const entry of dates) {
      const deadline = new Date(entry.date);
      deadline.setHours(0, 0, 0, 0);

      const diffMs = deadline.getTime() - today.getTime();
      const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (daysLeft <= alertDays && daysLeft >= 0) {
        this.logger.warn(
          `Echeance proche: ${entry.key} dans ${daysLeft} jour(s)`,
        );

        await this.webhookService.sendAlert({
          type: entry.key,
          targetRole: entry.targetRole,
          date: entry.date,
          daysLeft,
        });

        await this.prisma.academicDate.update({
          where: { id: entry.id },
          data: { notificationSent: true },
        });
      }
    }

    this.logger.log('Verification terminee');
  }
}
