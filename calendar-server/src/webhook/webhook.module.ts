import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookGateway } from './webhook.gateway';

@Module({
  providers: [WebhookGateway, WebhookService],
})
export class WebhookModule {}
