import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterClientDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'Juan', description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
