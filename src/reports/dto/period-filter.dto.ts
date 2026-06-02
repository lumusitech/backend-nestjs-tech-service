import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodFilterDto {
  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'monthly',
  })
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'Reparación' })
  @IsString()
  @IsOptional()
  category?: string;
}
