import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationType } from '../enums/notification-type.enum';

export class FilterNotificationDto extends PaginationDto {
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
