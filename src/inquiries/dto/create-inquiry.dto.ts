import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquirySource } from '../enums/inquiry-source.enum';

export class CreateInquiryDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @ApiPropertyOptional({ example: '+54 11 1234-5678' })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsString()
  @IsOptional()
  clientEmail?: string;

  @ApiPropertyOptional({ example: 'Av. Corrientes 1234, CABA' })
  @IsString()
  @IsOptional()
  clientAddress?: string;

  @ApiProperty({ example: 'La notebook no prende, hace ruido raro el ventilador' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: InquirySource, example: InquirySource.PHONE })
  @IsEnum(InquirySource)
  source!: InquirySource;

  @ApiPropertyOptional({ example: 'high' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
}
