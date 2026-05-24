import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatesModule } from './dates/dates.module';
import { WebhookModule } from './webhook/webhook.module';
import { CheckerModule } from './checker/checker.module';

@Module({
  imports: [DatesModule, WebhookModule, CheckerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
