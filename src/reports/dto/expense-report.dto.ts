import { ApiProperty } from '@nestjs/swagger';
import { PeriodLabelDto } from './income-report.dto';

export class ExpenseByCategoryDto {
  @ApiProperty({ example: 'materials' })
  category!: string;

  @ApiProperty({ example: 'Materiales' })
  label!: string;

  @ApiProperty({ example: 80000 })
  total!: number;

  @ApiProperty({ example: 15 })
  count!: number;

  @ApiProperty({ example: 60.5 })
  percentage!: number;
}

export class ExpenseReportDto {
  @ApiProperty({ type: PeriodLabelDto })
  period!: PeriodLabelDto;

  @ApiProperty({ example: 132000 })
  totalExpenses!: number;

  @ApiProperty({ type: [ExpenseByCategoryDto] })
  byCategory!: ExpenseByCategoryDto[];

  @ApiProperty({ example: 120000 })
  previousPeriodTotal!: number;

  @ApiProperty({ example: 10 })
  changePercentage!: number;
}
