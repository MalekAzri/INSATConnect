import { NotificationRole } from '../../common/enums/notification-role.enum';

export interface NotificationEventData {
  id: number;
  type: string;
  message: string;
  role: NotificationRole;
  targetYear?: string | null;
  targetUserId?: string | null;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface PublishNotificationInput {
  type: string;
  message: string;
  role: NotificationRole;
  targetYear?: string | null;
  targetUserId?: string | null;
  data?: Record<string, unknown>;
}
