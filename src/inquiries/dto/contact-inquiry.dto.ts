import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryRecommendation } from '../enums/inquiry-recommendation.enum';

export class ContactInquiryDto {
  @ApiProperty({ example: 'El ventilador está sucio, necesita limpieza general y cambio de pasta térmica' })
  @IsString()
  @IsNotEmpty()
  technicianNotes!: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 'Pasta térmica Arctic MX-4, aire comprimido' })
  @IsString()
  @IsOptional()
  materialsNeeded?: string;

  @ApiPropertyOptional({ enum: InquiryRecommendation })
  @IsEnum(InquiryRecommendation)
  @IsOptional()
  recommendation?: InquiryRecommendation;
}
