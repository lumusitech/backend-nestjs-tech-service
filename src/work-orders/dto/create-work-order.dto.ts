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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkOrderDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  @IsNotEmpty()
  serviceTypeId!: string;

  @ApiPropertyOptional({ example: ['c3d4e5f6-a7b8-9012-cdef-123456789012'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  technicianIds?: string[];

  @ApiPropertyOptional({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    enum: WorkOrderLocation,
    example: WorkOrderLocation.ON_SITE,
  })
  @IsEnum(WorkOrderLocation)
  @IsOptional()
  location?: WorkOrderLocation;

  @ApiPropertyOptional({ example: 'Pantalla rota, necesita reemplazo' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  warrantyUntil?: string;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;
}
