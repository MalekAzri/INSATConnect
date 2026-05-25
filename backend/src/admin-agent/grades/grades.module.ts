import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { Publication } from '../publications/entities/publication.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { GradeSubmission } from './entities/grade-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GradeSubmission, Publication]),
    NotificationsModule,
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
