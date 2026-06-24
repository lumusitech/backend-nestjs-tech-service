import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterSupplierDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Proveedor', description: 'Search by name, contact or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
