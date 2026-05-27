// notifications.service.ts
import { Injectable, MessageEvent } from '@nestjs/common';
import { interval, map, merge, Observable, Subject, filter } from 'rxjs';
import { NotificationRole } from '../common/enums/notification-role.enum';
import {
  NotificationEventData,
  PublishNotificationInput,
} from './dto/notification-event.dto';
import { SubscribeNotificationsQueryDto } from './dto/subscribe-notifications.query.dto';
import { PrismaService } from '../../prisma/prisma.service';

// Mapping checker (ETUDIANT/PROF/ADMIN) → NotificationRole
const ROLE_MAP: Record<string, NotificationRole> = {
  ETUDIANT: NotificationRole.STUDENT,
  PROF:     NotificationRole.TEACHER,
  ADMIN:    NotificationRole.ADMIN,
};

// Labels lisibles pour le message
const EVENT_LABELS: Record<string, string> = {
  AFFICHAGE:    "Date d'affichage",
  DS:           'Devoir surveillé',
  EXAMEN:       'Examen',
  DELIB:        'Délibération',
  REMISE_NOTES: 'Remise des notes',
};

@Injectable()
export class NotificationsService {
  private readonly events$ = new Subject<NotificationEventData>();

  constructor(private readonly prisma: PrismaService) {}

  // ─── SSE Stream ───────────────────────────────────────────────────────────

  stream(query: SubscribeNotificationsQueryDto): Observable<MessageEvent> {
    const subscriberRole   = query.role ?? NotificationRole.ALL;
    const subscriberYear   = query.year?.trim().toUpperCase();
    const subscriberUserId = query.userId?.trim();

    const notifications$ = this.events$.pipe(
      filter((event) =>
        this.matches(event, subscriberRole, subscriberYear, subscriberUserId),
      ),
      map((event) => ({
        id:   String(event.id),
        type: event.type,
        data: event,
      })),
    );

    const heartbeat$ = interval(25_000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() },
      })),
    );

    return merge(notifications$, heartbeat$);
  }

  // ─── Publish (usage interne + webhook) ────────────────────────────────────

  async publish(input: PublishNotificationInput): Promise<NotificationEventData> {
    const timestamp = new Date();

    const saved = await this.prisma.notification.create({
      data: {
        type:         input.type,
        message:      input.message,
        role:         input.role,
        targetYear:   input.targetYear?.toUpperCase() ?? null,
        targetUserId: input.targetUserId ?? null,
        data:         input.data ? JSON.stringify(input.data) : null,
        timestamp,
      },
    });

    const event: NotificationEventData = {
      id:           saved.id,
      type:         input.type,
      message:      input.message,
      role:         input.role,
      targetYear:   input.targetYear?.toUpperCase() ?? null,
      targetUserId: input.targetUserId ?? null,
      data:         input.data,
      timestamp:    timestamp.toISOString(),
    };

    this.events$.next(event);
    return event;
  }

  // ─── Appelé par le WebhookController ──────────────────────────────────────

  async publishFromChecker(payload: {
    type: string;      // AFFICHAGE | DS | EXAMEN | DELIB | REMISE_NOTES
    targetRole: string; // ETUDIANT | PROF | ADMIN
    date: string;
    daysLeft: number;
  }): Promise<void> {
    const role    = ROLE_MAP[payload.targetRole] ?? NotificationRole.ALL;
    const label   = EVENT_LABELS[payload.type]   ?? payload.type;
    const message = payload.daysLeft === 0
      ? `${label} aujourd'hui !`
      : `${label} dans ${payload.daysLeft} jour(s)`;

    await this.publish({
      type:    'deadline_alert',
      message,
      role,
      data: {
        eventType: payload.type,
        date:      payload.date,
        daysLeft:  payload.daysLeft,
      },
    });
  }

  // ─── Historique ───────────────────────────────────────────────────────────

  async getHistory(
    role: NotificationRole,
    year?: string,
    userId?: string,
  ): Promise<NotificationEventData[]> {
    const subscriberYear   = year?.trim().toUpperCase();
    const subscriberUserId = userId?.trim();

    try {
      const where: any = {
        role: { in: [role, NotificationRole.ALL] },
      };

      if (subscriberYear) {
        where.AND = [
          ...(where.AND ?? []),
          { OR: [{ targetYear: subscriberYear }, { targetYear: null }] },
        ];
      }

      if (subscriberUserId) {
        where.AND = [
          ...(where.AND ?? []),
          { OR: [{ targetUserId: subscriberUserId }, { targetUserId: null }] },
        ];
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      return notifications.map((n) => ({
        id:           n.id,
        type:         n.type,
        message:      n.message,
        role:         n.role as NotificationRole,
        targetYear:   n.targetYear,
        targetUserId: n.targetUserId ?? null,
        data:         this.safeParseJson(n.data),
        timestamp:    n.timestamp.toISOString(),
      }));
    } catch (error) {
      if (this.isMissingTableError(error, 'Notification')) return [];
      throw error;
    }
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  private matches(
    event: NotificationEventData,
    subscriberRole: NotificationRole,
    subscriberYear?: string,
    subscriberUserId?: string,
  ): boolean {
    // Admin reçoit tout
    if (subscriberRole === NotificationRole.ALL) return true;

    // Vérifier que l'event est destiné à ce rôle (ou à tous)
    if (
      event.role !== NotificationRole.ALL &&
      event.role !== subscriberRole
    ) {
      return false;
    }

    // Filtrage par année (étudiants)
    if (
      event.targetYear &&
      subscriberRole === NotificationRole.STUDENT &&
      subscriberYear !== event.targetYear
    ) {
      return false;
    }

    // Filtrage par userId
    if (event.targetUserId && subscriberUserId !== event.targetUserId) {
      return false;
    }

    return true;
  }

  private safeParseJson(raw: string | null): Record<string, unknown> | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  }

  private isMissingTableError(error: unknown, modelName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    const meta = (error as { meta?: { modelName?: string } }).meta;
    return code === 'P2021' && meta?.modelName === modelName;
  }
}