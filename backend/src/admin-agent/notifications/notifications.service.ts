import { Injectable, MessageEvent } from '@nestjs/common';
import { interval, map, merge, Observable, Subject, filter } from 'rxjs';
import { NotificationRole } from '../common/enums/notification-role.enum';
import {
  NotificationEventData,
  PublishNotificationInput,
} from './dto/notification-event.dto';
import { SubscribeNotificationsQueryDto } from './dto/subscribe-notifications.query.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly events$ = new Subject<NotificationEventData>();
  private sequence = 0;

  constructor(private readonly prisma: PrismaService) {}

  stream(query: SubscribeNotificationsQueryDto): Observable<MessageEvent> {
    const subscriberRole = query.role ?? NotificationRole.ALL;
    const subscriberYear = query.year?.trim().toUpperCase();

    const notifications$ = this.events$.pipe(
      filter((event) => this.matches(event, subscriberRole, subscriberYear)),
      map((event) => ({
        id: String(event.id),
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

  async publish(input: PublishNotificationInput): Promise<NotificationEventData> {
    const timestamp = new Date();

    // Persist to database
    const saved = await this.prisma.notification.create({
      data: {
        type: input.type,
        message: input.message,
        role: input.role,
        targetYear: input.targetYear?.toUpperCase() ?? null,
        data: input.data ? JSON.stringify(input.data) : null,
        timestamp,
      },
    });

    const event: NotificationEventData = {
      id: saved.id,
      type: input.type,
      message: input.message,
      role: input.role,
      targetYear: input.targetYear?.toUpperCase() ?? null,
      data: input.data,
      timestamp: timestamp.toISOString(),
    };

    this.events$.next(event);
    return event;
  }

  async getHistory(role: NotificationRole, year?: string): Promise<NotificationEventData[]> {
    const subscriberYear = year?.trim().toUpperCase();

    let notifications: Array<{
      id: number;
      type: string;
      message: string;
      role: string;
      targetYear: string | null;
      data: string | null;
      timestamp: Date;
    }> = [];

    try {
      notifications = await this.prisma.notification.findMany({
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    } catch (error) {
      if (this.isMissingTableError(error, 'Notification')) {
        return [];
      }
      throw error;
    }

    return notifications
      .map(n => ({
        id: n.id,
        type: n.type,
        message: n.message,
        role: n.role as NotificationRole,
        targetYear: n.targetYear,
        data: this.safeParseJson(n.data),
        timestamp: n.timestamp.toISOString(),
      }))
      .filter(event => this.matches(event, role, subscriberYear));
  }

  private safeParseJson(raw: string | null): Record<string, unknown> | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return undefined;
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

  private matches(
    event: NotificationEventData,
    subscriberRole: NotificationRole,
    subscriberYear?: string,
  ): boolean {
    if (subscriberRole !== NotificationRole.ALL) {
      if (
        event.role !== NotificationRole.ALL &&
        event.role !== subscriberRole
      ) {
        return false;
      }
    }

    if (subscriberRole === NotificationRole.ALL) {
      return true;
    }

    if (!event.targetYear) {
      return true;
    }

    if (subscriberRole === NotificationRole.STUDENT) {
      return subscriberYear === event.targetYear;
    }

    return true;
  }
}
