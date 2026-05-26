import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Headers,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRole } from '../common/enums/notification-role.enum';
import { CalendarWebhookDto } from './dto/calendar-webhook.dto';

const EVENT_MESSAGES: Record<string, string> = {
  ds_remise: 'Rappel : la date de remise des notes de DS approche',
  exam_remise: "Rappel : la date de remise des notes d'examen approche",
  ds_affichage: "Les notes de DS seront bientôt affichées",
  exam_affichage: "Les notes d'examen seront bientôt affichées",
  sem1_deliberation: 'Les délibérations du semestre 1 approchent',
  sem2_deliberation: 'Les délibérations du semestre 2 approchent',
  final_deliberation: 'Les délibérations finales approchent',
};

function mapRole(targetRole: string): NotificationRole {
  const normalized = targetRole.trim().toLowerCase();
  if (normalized === 'professeur' || normalized === 'teacher') {
    return NotificationRole.TEACHER;
  }
  return NotificationRole.ADMIN;
}

@Controller('admin-agent/calendar')
export class CalendarWebhookController {
  private readonly logger = new Logger(CalendarWebhookController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: CalendarWebhookDto,
  ) {
    this.verifySignature(signature, payload);

    const role = mapRole(payload.targetRole);
    const typeKey = payload.type.trim();
    const message =
      EVENT_MESSAGES[typeKey] ??
      `Rappel calendrier : ${typeKey} dans ${payload.daysLeft} jour(s)`;

    void this.notificationsService.publish({
      type: `calendar.reminder.${typeKey}`,
      message: `Rappel : ${message} (J-${payload.daysLeft})`,
      role,
      data: { eventType: typeKey, date: payload.date, daysLeft: payload.daysLeft },
    });

    this.logger.log(`Webhook reçu : ${typeKey} → ${role} (J-${payload.daysLeft})`);
    return { received: true };
  }

  private verifySignature(signature: string, payload: CalendarWebhookDto): void {
    const secret = this.config.get<string>('WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('WEBHOOK_SECRET non configuré — signature ignorée');
      return;
    }
    if (!signature) throw new BadRequestException('Signature webhook manquante');

    const body = JSON.stringify(payload);
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expected);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      this.logger.warn(`Signature invalide reçue : ${signature}`);
      throw new BadRequestException('Signature webhook invalide');
    }
  }
}
