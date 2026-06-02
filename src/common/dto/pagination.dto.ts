import { IsOptional, IsPositive, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'ASC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}
