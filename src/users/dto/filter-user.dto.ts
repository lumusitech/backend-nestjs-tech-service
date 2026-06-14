import { IsOptional, IsEnum } from 'class-validator';
import { IntersectionType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../enums/user-role.enum';

export class FilterUserDto extends IntersectionType(PaginationDto) {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter by user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
