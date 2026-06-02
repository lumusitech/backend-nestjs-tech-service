import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationType } from '../enums/notification-type.enum';

export class FilterNotificationDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: NotificationType,
    example: NotificationType.PAYMENT_APPROVED,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
