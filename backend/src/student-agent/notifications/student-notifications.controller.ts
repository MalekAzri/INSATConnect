import { Controller, MessageEvent, Query, Sse, Get } from '@nestjs/common';
import { Observable } from 'rxjs';
import { NotificationsService } from '../../admin-agent/notifications/notifications.service';
import { SubscribeNotificationsQueryDto } from '../../admin-agent/notifications/dto/subscribe-notifications.query.dto';
import { NotificationRole } from '../../admin-agent/common/enums/notification-role.enum';

@Controller('student-agent/notifications')
export class StudentNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  stream(
    @Query() query: SubscribeNotificationsQueryDto,
  ): Observable<MessageEvent> {
    return this.notificationsService.stream(query);
  }

  @Get('history')
  async getHistory(@Query() query: SubscribeNotificationsQueryDto) {
    return this.notificationsService.getHistory(NotificationRole.STUDENT, query.year);
  }
}
