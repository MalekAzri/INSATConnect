import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PatchAcademicCalendarDto,
  UpsertAcademicCalendarDto,
} from './dto/upsert-academic-calendar.dto';
import { AcademicCalendarConfig } from './entities/academic-calendar.entity';
import { CalendarSyncService } from './calendar-sync.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(AcademicCalendarConfig)
    private readonly calendarRepo: Repository<AcademicCalendarConfig>,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  async getConfig(): Promise<AcademicCalendarConfig | null> {
    return this.calendarRepo.findOne({
      where: {},
      order: { updatedAt: 'DESC' },
    });
  }

  async upsertConfig(dto: UpsertAcademicCalendarDto, syncCalendar = true) {
    const current = await this.getConfig();

    const config = this.calendarRepo.create({
      ...(current ?? {}),
      ...dto,
      updatedBy: dto.updatedBy?.trim() || current?.updatedBy || 'Agent admin',
    });

    const saved = await this.calendarRepo.save(config);
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

    if (dto.updatedBy !== undefined) {
      current.updatedBy = dto.updatedBy?.trim() || 'Agent admin';
    }

    for (const [key, value] of Object.entries(dto)) {
      if (key === 'updatedBy' || value === undefined) continue;
      (current as unknown as Record<string, unknown>)[key] = value;
    }

    const saved = await this.calendarRepo.save(current);
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
