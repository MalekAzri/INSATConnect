import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PatchAcademicCalendarDto,
  UpsertAcademicCalendarDto,
} from './dto/upsert-academic-calendar.dto';
import { AcademicCalendarConfig } from './entities/academic-calendar.entity';
import { CalendarSyncService } from './calendar-sync.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRole } from '../common/enums/notification-role.enum';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarSyncService: CalendarSyncService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getConfig(): Promise<AcademicCalendarConfig | null> {
    try {
      return await this.prisma.academicCalendarConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      if (this.isMissingTableError(error, 'AcademicCalendarConfig')) {
        return null;
      }
      throw error;
    }
  }

  async upsertConfig(dto: UpsertAcademicCalendarDto, syncCalendar = true) {
    const current = await this.getConfig();
    let saved: AcademicCalendarConfig;

    const data = {
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

    try {
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
    } catch (error) {
      this.rethrowStorageError(error, 'AcademicCalendarConfig');
      throw error;
    }

    const sync = await this.trySync(saved, syncCalendar);
    this.publishCalendarUpdated();

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

    let saved: AcademicCalendarConfig;
    try {
      saved = await this.prisma.academicCalendarConfig.update({
        where: { id: current.id },
        data,
      });
    } catch (error) {
      this.rethrowStorageError(error, 'AcademicCalendarConfig');
      throw error;
    }

    const sync = await this.trySync(saved, syncCalendar);
    this.publishCalendarUpdated();

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

  private publishCalendarUpdated() {
    const msg = "Le calendrier académique a été mis à jour par l'administration";
    void this.notificationsService.publish({ type: 'calendar.updated', message: msg, role: NotificationRole.TEACHER });
    void this.notificationsService.publish({ type: 'calendar.updated', message: msg, role: NotificationRole.STUDENT });
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

  private isMissingTableError(error: unknown, modelName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    const meta = (error as { meta?: { modelName?: string } }).meta;
    return code === 'P2021' && meta?.modelName === modelName;
  }

  private rethrowStorageError(error: unknown, modelName: string): void {
    if (this.isMissingTableError(error, modelName)) {
      throw new ServiceUnavailableException(
        `Table Prisma ${modelName} introuvable. Exécutez les migrations Prisma avant de générer le calendrier.`,
      );
    }
  }
}
