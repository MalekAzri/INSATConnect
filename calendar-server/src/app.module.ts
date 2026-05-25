import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatesModule } from './dates/dates.module';
import { CheckerModule } from './checker/checker.module';
import { WebhookModule } from './webhook/webhook.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Config globale depuis .env
    ConfigModule.forRoot({ isGlobal: true }),

    // CRON activé
    ScheduleModule.forRoot(),

    // Base de données Prisma
    PrismaModule,

    DatesModule,
    CheckerModule,
    WebhookModule,
  ],
})
export class AppModule {}