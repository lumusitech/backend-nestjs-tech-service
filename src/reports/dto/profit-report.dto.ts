import { ApiProperty } from '@nestjs/swagger';
import { PeriodLabelDto } from './income-report.dto';

export class ProfitReportDto {
  @ApiProperty({ type: PeriodLabelDto })
  period!: PeriodLabelDto;

  @ApiProperty({ example: 330000 })
  income!: number;

  @ApiProperty({ example: 80000 })
  materialCosts!: number;

  @ApiProperty({ example: 52000 })
  operationalExpenses!: number;

  @ApiProperty({ example: 250000 })
  grossProfit!: number;

  @ApiProperty({ example: 198000 })
  netProfit!: number;

  @ApiProperty({ example: 25 })
  workOrderCount!: number;

  @ApiProperty({ example: 180000 })
  previousPeriodNetProfit!: number;

  @ApiProperty({ example: 10 })
  changePercentage!: number;
}
