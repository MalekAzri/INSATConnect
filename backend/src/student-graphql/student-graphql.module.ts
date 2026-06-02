import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentResolvers } from './student.resolvers';
import { Publication } from '../admin-agent/publications/entities/publication.entity';
import { AcademicCalendarConfig } from '../admin-agent/calendar/entities/academic-calendar.entity';
import { GradeSubmission } from '../admin-agent/grades/entities/grade-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Publication,
      AcademicCalendarConfig,
      GradeSubmission,
    ]),
  ],
  providers: [StudentResolvers],
})
export class StudentGraphqlModule {}
