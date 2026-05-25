import { Injectable, MessageEvent } from '@nestjs/common';
import { interval, map, merge, Observable, Subject, filter } from 'rxjs';
import { NotificationRole } from '../common/enums/notification-role.enum';
import {
  NotificationEventData,
  PublishNotificationInput,
} from './dto/notification-event.dto';
import { SubscribeNotificationsQueryDto } from './dto/subscribe-notifications.query.dto';

@Injectable()
export class NotificationsService {
  private readonly events$ = new Subject<NotificationEventData>();
  private sequence = 0;

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

  publish(input: PublishNotificationInput): NotificationEventData {
    const event: NotificationEventData = {
      id: ++this.sequence,
      type: input.type,
      message: input.message,
      role: input.role,
      targetYear: input.targetYear?.toUpperCase() ?? null,
      data: input.data,
      timestamp: new Date().toISOString(),
    };

    this.events$.next(event);
    return event;
  }

  private matches(
    event: NotificationEventData,
    subscriberRole: NotificationRole,
    subscriberYear?: string,
  ): boolean {
    if (subscriberRole !== NotificationRole.ALL) {
      if (event.role !== NotificationRole.ALL && event.role !== subscriberRole) {
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
