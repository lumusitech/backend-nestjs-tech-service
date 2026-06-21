import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InquiryStatus } from '../enums/inquiry-status.enum';
import { InquirySource } from '../enums/inquiry-source.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterInquiryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  @IsOptional()
  status?: InquiryStatus;

  @ApiPropertyOptional({ example: 'high' })
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ enum: InquirySource })
  @IsEnum(InquirySource)
  @IsOptional()
  source?: InquirySource;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
