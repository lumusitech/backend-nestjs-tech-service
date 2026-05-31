import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Priority } from '../../common/enums/priority.enum';
import { WorkOrderLocation } from '../enums/work-order-location.enum';

export class CreateWorkOrderDto {
  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  @IsUUID()
  @IsNotEmpty()
  serviceTypeId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  technicianIds?: string[];

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(WorkOrderLocation)
  @IsOptional()
  location?: WorkOrderLocation;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsDateString()
  @IsOptional()
  warrantyUntil?: string;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;
}
