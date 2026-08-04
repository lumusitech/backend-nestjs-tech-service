import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsDateRangeValid } from '../../common/utils/date-range.validator';
import { ToBoolean } from '../../common/utils/boolean-filter.util';

export class FilterClientDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Juan',
    description: 'Search by name, email or phone',
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
