import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookUrl: string;
    private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
     this.webhookUrl    = this.config.getOrThrow<string>('MAIN_SERVER_WEBHOOK_URL');
    this.webhookSecret = this.config.getOrThrow<string>('WEBHOOK_SECRET');
  }

  async sendAlert(payload: {
    type: string;       // ex: 'ds_remise', 'exam_affichage', etc.
    targetRole: string; // 'professeur'  'admin'
    date: string;
    daysLeft: number;
  }): Promise<void> {

    const body   = JSON.stringify(payload);

    // Signature HMAC-SHA256 pour authentifier l'envoi
    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(body)
      .digest('hex');

    try {
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
        },
      });
      this.logger.log(`Webhook envoyé : ${payload.type} → ${payload.targetRole} (J-${payload.daysLeft})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Échec du webhook : ${message}`);
    }
  }
}