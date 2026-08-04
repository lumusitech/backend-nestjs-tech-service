import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ToBoolean } from '../../common/utils/boolean-filter.util';
import { NotificationType } from '../enums/notification-type.enum';

export class FilterNotificationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title or message' })
  @IsOptional()
  @IsString()
  search?: string;

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
  @ToBoolean()
  isRead?: boolean;
}
