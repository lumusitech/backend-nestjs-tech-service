import { PeriodLabelDto } from './income-report.dto';

export class ProfitReportDto {
  period!: PeriodLabelDto;
  income!: number;
  materialCosts!: number;
  operationalExpenses!: number;
  grossProfit!: number;
  netProfit!: number;
  workOrderCount!: number;
  previousPeriodNetProfit!: number;
  changePercentage!: number;
}
