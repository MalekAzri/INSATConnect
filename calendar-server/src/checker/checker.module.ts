import { Module } from '@nestjs/common';
import { WebhookModule } from '../webhook/webhook.module';
import { CheckerService } from './checker.service';

@Module({
  imports: [WebhookModule],
  providers: [CheckerService],
})
export class CheckerModule {}