import { Controller, Get, MessageEvent, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { SubscribeNotificationsQueryDto } from './dto/subscribe-notifications.query.dto';
import { NotificationRole } from '../common/enums/notification-role.enum';

@Controller('admin-agent/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  stream(
    @Query() query: SubscribeNotificationsQueryDto,
  ): Observable<MessageEvent> {
    return this.notificationsService.stream(query);
  }

  @Get('history')
  getHistory(@Query() query: SubscribeNotificationsQueryDto) {
    return this.notificationsService.getHistory(
      query.role ?? NotificationRole.ALL,
      query.year,
      query.userId,
    );
  }
}
