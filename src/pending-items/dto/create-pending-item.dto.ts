import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PendingItemType } from '../enums/pending-item-type.enum';
import { PendingItemPriority } from '../enums/pending-item-priority.enum';

export class CreatePendingItemDto {
  @ApiProperty({ example: 'Revisar garantía de repuesto' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    example: 'Verificar si el repuesto aún tiene garantía del proveedor',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-06-20' })
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ enum: PendingItemType, example: PendingItemType.WORK_ORDER })
  @IsEnum(PendingItemType)
  type!: PendingItemType;

  @ApiPropertyOptional({
    enum: PendingItemPriority,
    example: PendingItemPriority.HIGH,
  })
  @IsEnum(PendingItemPriority)
  @IsOptional()
  priority?: PendingItemPriority;

  @ApiPropertyOptional({ example: 'work_order' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
