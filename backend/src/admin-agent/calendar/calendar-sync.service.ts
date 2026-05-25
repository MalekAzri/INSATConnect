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
        dsRemise: config.dsRemise,
        examRemise: config.examRemise,
        dsAffichage: config.dsAffichage,
        examAffichage: config.examAffichage,
        sem1Deliberation: config.sem1Deliberation,
        sem2Deliberation: config.sem2Deliberation,
        DeliberationFinale: config.deliberationFinale,
      },
      {
        timeout: 4_000,
      },
    );
  }
}
