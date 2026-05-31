import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { CreateWorkOrderDto } from './create-work-order.dto';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';

export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
