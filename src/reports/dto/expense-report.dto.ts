import { PeriodLabelDto } from './income-report.dto';

export class ExpenseByCategoryDto {
  category!: string;
  label!: string;
  total!: number;
  count!: number;
  percentage!: number;
}

export class ExpenseReportDto {
  period!: PeriodLabelDto;
  totalExpenses!: number;
  byCategory!: ExpenseByCategoryDto[];
  previousPeriodTotal!: number;
  changePercentage!: number;
}
