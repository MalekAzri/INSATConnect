import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PatchAcademicCalendarDto,
  UpsertAcademicCalendarDto,
} from './dto/upsert-academic-calendar.dto';
import { AcademicCalendarConfig } from './entities/academic-calendar.entity';
import { CalendarSyncService } from './calendar-sync.service';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  async getConfig(): Promise<AcademicCalendarConfig | null> {
    return this.prisma.academicCalendarConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsertConfig(dto: UpsertAcademicCalendarDto, syncCalendar = true) {
    const current = await this.getConfig();
    let saved: AcademicCalendarConfig;

    const data = {
      dsRemise: dto.dsRemise,
      examRemise: dto.examRemise,
      dsAffichage: dto.dsAffichage,
      examAffichage: dto.examAffichage,
      sem1Deliberation: dto.sem1Deliberation,
      sem2Deliberation: dto.sem2Deliberation,
      deliberationFinale: dto.deliberationFinale,
      s1_ds: dto.s1_ds ?? null,
      s1_exam: dto.s1_exam ?? null,
      s1_grades_ds: dto.s1_grades_ds ?? null,
      s1_publish_ds: dto.s1_publish_ds ?? null,
      s1_grades_exam: dto.s1_grades_exam ?? null,
      s1_publish_exam: dto.s1_publish_exam ?? null,
      s1_delib: dto.s1_delib ?? null,
      s2_ds: dto.s2_ds ?? null,
      s2_exam: dto.s2_exam ?? null,
      s2_grades_ds: dto.s2_grades_ds ?? null,
      s2_publish_ds: dto.s2_publish_ds ?? null,
      s2_grades_exam: dto.s2_grades_exam ?? null,
      s2_publish_exam: dto.s2_publish_exam ?? null,
      s2_delib: dto.s2_delib ?? null,
      end_year: dto.end_year ?? null,
      updatedBy: dto.updatedBy?.trim() || current?.updatedBy || 'Agent admin',
    };

    if (current) {
      saved = await this.prisma.academicCalendarConfig.update({
        where: { id: current.id },
        data,
      });
    } else {
      saved = await this.prisma.academicCalendarConfig.create({
        data,
      });
    }

    const sync = await this.trySync(saved, syncCalendar);

    return { config: saved, sync };
  }

  async patchConfig(dto: PatchAcademicCalendarDto, syncCalendar = true) {
    const current = await this.getConfig();
    if (!current) {
      throw new NotFoundException(
        'Aucune configuration calendrier trouvée. Utilisez PUT /admin-agent/calendar.',
      );
    }

    const data: any = {};
    if (dto.updatedBy !== undefined) {
      data.updatedBy = dto.updatedBy?.trim() || 'Agent admin';
    }

    for (const [key, value] of Object.entries(dto)) {
      if (key === 'updatedBy' || value === undefined) continue;
      data[key] = value;
    }

    const saved = await this.prisma.academicCalendarConfig.update({
      where: { id: current.id },
      data,
    });

    const sync = await this.trySync(saved, syncCalendar);

    return { config: saved, sync };
  }

  async forceSync() {
    const current = await this.getConfig();
    if (!current) {
      throw new NotFoundException(
        'Impossible de synchroniser: aucune configuration calendrier enregistrée.',
      );
    }

    const sync = await this.trySync(current, true);
    return { config: current, sync };
  }

  private async trySync(config: AcademicCalendarConfig, enabled: boolean) {
    if (!enabled) {
      return { synced: false, reason: 'sync disabled by query flag' };
    }

    try {
      await this.calendarSyncService.pushDates(config);
      return { synced: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { synced: false, reason: message };
    }
  }
}
