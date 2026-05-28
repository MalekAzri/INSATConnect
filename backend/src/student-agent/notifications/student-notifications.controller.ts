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
    @Query() query: SubscribeNotificationsQueryDto,//role, year, userId arrivés du front pour filtrer les notifications en fonction de l'étudiant connecté
  ): Observable<MessageEvent> {//retourne un flux sse pour notifier le front de l'etudiant qui s'est inscrit
    return this.notificationsService.stream(query);//s'inscrire au flux 
  }

  @Get('history')
  async getHistory(@Query() query: SubscribeNotificationsQueryDto) {
    return this.notificationsService.getHistory(NotificationRole.STUDENT, query.year, query.userId);
  }
}
