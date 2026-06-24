import { IsOptional, IsEnum, IsUUID, IsDateString, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PendingItemType } from '../enums/pending-item-type.enum';
import { PendingItemPriority } from '../enums/pending-item-priority.enum';
import { PendingItemStatus } from '../enums/pending-item-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterPendingItemDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: PendingItemStatus,
    example: PendingItemStatus.PENDING,
  })
  @IsEnum(PendingItemStatus)
  @IsOptional()
  status?: PendingItemStatus;

  @ApiPropertyOptional({
    enum: PendingItemPriority,
    example: PendingItemPriority.HIGH,
  })
  @IsEnum(PendingItemPriority)
  @IsOptional()
  priority?: PendingItemPriority;

  @ApiPropertyOptional({
    enum: PendingItemType,
    example: PendingItemType.WORK_ORDER,
  })
  @IsEnum(PendingItemType)
  @IsOptional()
  type?: PendingItemType;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  dueDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  dueDateTo?: string;
}
