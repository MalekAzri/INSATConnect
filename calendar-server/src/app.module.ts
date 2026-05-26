import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatesModule } from './dates/dates.module';
import { CheckerModule } from './checker/checker.module';
import { WebhookModule } from './webhook/webhook.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    DatesModule,
    CheckerModule,
    WebhookModule,
  ],
})
export class AppModule {}
