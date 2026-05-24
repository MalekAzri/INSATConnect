import { WebSocketGateway } from '@nestjs/websockets';
import { WebhookService } from './webhook.service';

@WebSocketGateway()
export class WebhookGateway {
  constructor(private readonly webhookService: WebhookService) {}
}
