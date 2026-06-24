import { IsOptional, IsEnum, IsDateString, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ExpenseCategory } from '../enums/expense-category.enum';

export class FilterExpenseDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by description or notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ExpenseCategory,
    example: ExpenseCategory.TOOLS,
  })
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}
