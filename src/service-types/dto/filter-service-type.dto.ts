import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsDateRangeValid } from '../../common/utils/date-range.validator';
import { ToBoolean } from '../../common/utils/boolean-filter.util';

export class FilterServiceTypeDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Instalación',
    description: 'Search by name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Filter by creation date start',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Filter by creation date end',
  })
  @IsDateString()
  @IsOptional()
  @IsDateRangeValid()
  dateTo?: string;
}
