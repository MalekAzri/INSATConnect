import { Injectable } from '@nestjs/common';
import { AcademicDate } from '@prisma/client';
import { SetDatesDto } from './dto/set-date.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatesService {
  constructor(private readonly prisma: PrismaService) {}

  async setDates(dto: SetDatesDto): Promise<void> {
    const entries = [
      { key: 'ds_remise', date: dto.dsRemise, targetRole: 'professeur' },
      { key: 'exam_remise', date: dto.examRemise, targetRole: 'professeur' },
      { key: 'ds_affichage', date: dto.dsAffichage, targetRole: 'admin' },
      { key: 'exam_affichage', date: dto.examAffichage, targetRole: 'admin' },
      {
        key: 'sem1_deliberation',
        date: dto.sem1Deliberation,
        targetRole: 'admin',
      },
      {
        key: 'sem2_deliberation',
        date: dto.sem2Deliberation,
        targetRole: 'admin',
      },
      {
        key: 'final_deliberation',
        date: dto.DeliberationFinale,
        targetRole: 'admin',
      },
    ];

    for (const entry of entries) {
      await this.prisma.academicDate.upsert({
        where: { key: entry.key },
        create: { ...entry, notificationSent: false },
        update: {
          date: entry.date,
          targetRole: entry.targetRole,
          notificationSent: false,
        },
      });
    }
  }

  async getAllDates(): Promise<AcademicDate[]> {
    return this.prisma.academicDate.findMany({ orderBy: { id: 'asc' } });
  }
}
