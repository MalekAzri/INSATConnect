import { Controller, MessageEvent, Query, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { SubscribeNotificationsQueryDto } from './dto/subscribe-notifications.query.dto';

@Controller('admin-agent/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  stream(
    @Query() query: SubscribeNotificationsQueryDto,
  ): Observable<MessageEvent> {
    return this.notificationsService.stream(query);
  }
}
