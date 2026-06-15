import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { CreatePendingItemDto } from './create-pending-item.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PendingItemStatus } from '../enums/pending-item-status.enum';

export class UpdatePendingItemDto extends PartialType(CreatePendingItemDto) {
  @ApiPropertyOptional({
    enum: PendingItemStatus,
    example: PendingItemStatus.IN_PROGRESS,
  })
  @IsEnum(PendingItemStatus)
  @IsOptional()
  status?: PendingItemStatus;

  @ApiPropertyOptional({ example: '2026-06-15T10:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
