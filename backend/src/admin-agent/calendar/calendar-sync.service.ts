import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AcademicCalendarConfig } from './entities/academic-calendar.entity';

@Injectable()
export class CalendarSyncService {
  constructor(private readonly configService: ConfigService) {}

  async pushDates(config: AcademicCalendarConfig): Promise<void> {
    const url = this.configService.get<string>(
      'CALENDAR_SERVICE_URL',
      'http://localhost:3001/dates',
    );

    await axios.post(
      url,
      {
        s1_ds: config.s1_ds,
        s1_exam: config.s1_exam,
        s1_grades_ds: config.s1_grades_ds,
        s1_publish_ds: config.s1_publish_ds,
        s1_grades_exam: config.s1_grades_exam,
        s1_publish_exam: config.s1_publish_exam,
        s1_delib: config.s1_delib,
        s2_ds: config.s2_ds,
        s2_exam: config.s2_exam,
        s2_grades_ds: config.s2_grades_ds,
        s2_publish_ds: config.s2_publish_ds,
        s2_grades_exam: config.s2_grades_exam,
        s2_publish_exam: config.s2_publish_exam,
        s2_delib: config.s2_delib,
        end_year: config.end_year,
      },
      { timeout: 4_000 },
    );
  }
}
