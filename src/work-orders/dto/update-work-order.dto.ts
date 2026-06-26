import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { CreateWorkOrderDto } from './create-work-order.dto';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {
  @ApiPropertyOptional({
    enum: WorkOrderStatus,
    example: WorkOrderStatus.IN_PROGRESS,
  })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @ApiPropertyOptional({ example: '2026-06-10T08:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-06-10T17:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionPercent?: number;
}
