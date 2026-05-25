import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AcademicDate } from './dates/entities/academic-date.entity';
import { DatesModule } from './dates/dates.module';
import { CheckerModule } from './checker/checker.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    // Config globale depuis .env
    ConfigModule.forRoot({ isGlobal: true }),

    // CRON activé
    ScheduleModule.forRoot(),

    // Base de données SQLite
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DATABASE_PATH', './calendar.db'),
        entities: [AcademicDate],
        synchronize: true, // auto-migration en dev
      }),
    }),

    DatesModule,
    CheckerModule,
    WebhookModule,
  ],
})
export class AppModule {}