import { IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ExpenseCategory } from '../enums/expense-category.enum';

export class FilterExpenseDto extends PaginationDto {
  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}
