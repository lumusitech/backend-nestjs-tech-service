import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInquiryDto } from './create-inquiry.dto';
import { InquiryStatus } from '../enums/inquiry-status.enum';
import { InquiryRecommendation } from '../enums/inquiry-recommendation.enum';
import { InquiryDecision } from '../enums/inquiry-decision.enum';

export class UpdateInquiryDto extends PartialType(CreateInquiryDto) {
  @ApiPropertyOptional({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  technicianNotes?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 'Pasta térmica, limpieza de ventiladores' })
  @IsString()
  @IsOptional()
  materialsNeeded?: string;

  @ApiPropertyOptional({ enum: InquiryRecommendation })
  @IsEnum(InquiryRecommendation)
  @IsOptional()
  recommendation?: InquiryRecommendation;

  @ApiPropertyOptional({ enum: InquiryDecision })
  @IsEnum(InquiryDecision)
  @IsOptional()
  adminDecision?: InquiryDecision;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
