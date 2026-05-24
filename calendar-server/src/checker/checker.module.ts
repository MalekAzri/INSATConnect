import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicDate } from '../dates/entities/academic-date.entity';
import { WebhookModule } from '../webhook/webhook.module';
import { CheckerService } from './checker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicDate]),
    WebhookModule,
  ],
  providers: [CheckerService],
})
export class CheckerModule {}