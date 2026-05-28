import { Injectable } from '@nestjs/common';
import { AcademicDate } from '@prisma/client';
import { SetDatesDto } from './dto/set-date.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatesService {
  constructor(private readonly prisma: PrismaService) {}

  async setDates(dto: SetDatesDto): Promise<void> {
    const entries: { key: string; date: string; targetRole: string }[] = [
      // ── Semestre 1 ────────────────────────────────────────────────────────
      { key: 's1_ds',             date: dto.s1_ds,                              targetRole: 'admin' },
      { key: 's1_exam',           date: dto.s1_exam,                            targetRole: 'admin' },
      { key: 'ds_remise',         date: dto.s1_grades_ds   ,     targetRole: 'professeur' },
      { key: 'ds_affichage',      date: dto.s1_publish_ds  ,  targetRole: 'admin' },
      { key: 'exam_remise',       date: dto.s1_grades_exam ,   targetRole: 'professeur' },
      { key: 'exam_affichage',    date: dto.s1_publish_exam,targetRole: 'admin' },
      { key: 'sem1_deliberation', date: dto.s1_delib       , targetRole: 'admin' },

      // ── Semestre 2 ────────────────────────────────────────────────────────
      { key: 's2_ds',             date: dto.s2_ds,          targetRole: 'admin' },
      { key: 's2_exam',           date: dto.s2_exam,        targetRole: 'admin' },
      { key: 's2_grades_ds',      date: dto.s2_grades_ds,   targetRole: 'professeur' },
      { key: 's2_publish_ds',     date: dto.s2_publish_ds,  targetRole: 'admin' },
      { key: 's2_grades_exam',    date: dto.s2_grades_exam, targetRole: 'professeur' },
      { key: 's2_publish_exam',   date: dto.s2_publish_exam,targetRole: 'admin' },
      { key: 'sem2_deliberation', date: dto.s2_delib ,   targetRole: 'admin' },

      // ── Fin d'année ───────────────────────────────────────────────────────
      { key: 'final_deliberation', date: dto.end_year , targetRole: 'admin' },
    ]
    //  filtre ET cast — TypeScript sait que date est string après le filtre
    .filter((e): e is { key: string; date: string; targetRole: string } => !!e.date);

    for (const entry of entries) {
      await this.prisma.db.academicDate.upsert({
        where:  { key: entry.key },
        create: { ...entry, notificationSent: false },
        update: { date: entry.date, targetRole: entry.targetRole, notificationSent: false },
      });
    }
  }

  async getAllDates(): Promise<AcademicDate[]> {
    return this.prisma.db.academicDate.findMany({ orderBy: { id: 'asc' } });
  }
}