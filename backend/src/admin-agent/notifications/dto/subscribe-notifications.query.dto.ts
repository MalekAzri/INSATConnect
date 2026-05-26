import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationRole } from '../../common/enums/notification-role.enum';

export class SubscribeNotificationsQueryDto {
  @IsOptional()
  @IsEnum(NotificationRole)
  role?: NotificationRole;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  year?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  userId?: string;
}
