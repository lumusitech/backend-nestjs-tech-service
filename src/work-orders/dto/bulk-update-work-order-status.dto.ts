import { IsArray, ArrayNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';

export interface BulkStatusResultItem {
  id: string;
  status: WorkOrderStatus;
}

export interface BulkStatusFailedItem {
  id: string;
  reason: string;
}

export interface BulkStatusResult {
  succeeded: BulkStatusResultItem[];
  failed: BulkStatusFailedItem[];
}

export class BulkUpdateWorkOrderStatusDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of work order IDs to update',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @ApiProperty({
    enum: WorkOrderStatus,
    example: WorkOrderStatus.IN_PROGRESS,
  })
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;
}
