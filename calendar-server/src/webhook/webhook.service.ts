import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookUrl: string | null;
  private readonly webhookSecret: string | null;

  constructor(private readonly config: ConfigService) {
    this.webhookUrl =
      this.config.get<string>('MAIN_SERVER_WEBHOOK_URL') ?? null;
    this.webhookSecret = this.config.get<string>('WEBHOOK_SECRET') ?? null;

    if (!this.webhookUrl || !this.webhookSecret) {
      this.logger.warn(
        'Webhook disabled: MAIN_SERVER_WEBHOOK_URL or WEBHOOK_SECRET is not set.',
      );
    }
  }

  async sendAlert(payload: {
    type: string; // ex: 'ds_remise', 'exam_affichage', etc.
    targetRole: string; // 'professeur'  'admin'
    date: string;
    daysLeft: number;
  }): Promise<void> {
  if (!this.webhookUrl || !this.webhookSecret) return; // ← guard existante on arrete l'execution si les variables d'environnement ne sont pas configurées par securité

  const body = JSON.stringify(payload);
//creer une signature crypto, pour que le serveur recepteur sache qu'il s'agit bien d'une requete legitime venant de notre serveur et pas d'un attaquant qui essaierait de faire du spoofing
  const signature = crypto
    .createHmac('sha256', this.webhookSecret!) 
    .update(body)
    .digest('hex');
//envoyer la requete POST au serveur recepteur avec le payload et la signature dans les headers
  await axios.post(this.webhookUrl, body, {
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': `sha256=${signature}`,
    },
  });
}
}
