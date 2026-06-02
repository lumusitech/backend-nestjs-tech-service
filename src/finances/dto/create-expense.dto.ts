import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseCategory } from '../enums/expense-category.enum';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Office rent payment' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 25000.0 })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.RENT })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 'Monthly rent for office space' })
  @IsString()
  @IsOptional()
  notes?: string;
}
