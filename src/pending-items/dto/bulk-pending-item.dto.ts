import { IsArray, ArrayNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PendingItemStatus } from '../enums/pending-item-status.enum';

export interface BulkPendingItemStatusResult {
  succeeded: { id: string; status: PendingItemStatus }[];
  failed: { id: string; reason: string }[];
}

export interface BulkPendingItemDeleteResult {
  succeeded: { id: string }[];
  failed: { id: string; reason: string }[];
}

export class BulkUpdatePendingItemStatusDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of pending item IDs to update',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @ApiProperty({
    enum: PendingItemStatus,
    example: PendingItemStatus.COMPLETED,
  })
  @IsEnum(PendingItemStatus)
  status!: PendingItemStatus;
}

export class BulkDeletePendingItemsDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of pending item IDs to soft delete',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
