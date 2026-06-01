import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class PeriodFilterDto {
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
