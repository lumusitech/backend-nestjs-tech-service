import { ApiProperty } from '@nestjs/swagger';

export class PeriodLabelDto {
  @ApiProperty({ example: '2026-01-01' })
  from!: string;

  @ApiProperty({ example: '2026-01-31' })
  to!: string;

  @ApiProperty({ example: 'Enero 2026' })
  label!: string;
}

export class IncomeByMethodDto {
  @ApiProperty({ example: 'cash' })
  method!: string;

  @ApiProperty({ example: 'Efectivo' })
  label!: string;

  @ApiProperty({ example: 150000 })
  total!: number;

  @ApiProperty({ example: 12 })
  count!: number;

  @ApiProperty({ example: 45.5 })
  percentage!: number;
}

export class IncomeByDayDto {
  @ApiProperty({ example: '2026-01-15' })
  date!: string;

  @ApiProperty({ example: 25000 })
  total!: number;
}

export class IncomeReportDto {
  @ApiProperty({ type: PeriodLabelDto })
  period!: PeriodLabelDto;

  @ApiProperty({ example: 330000 })
  totalIncome!: number;

  @ApiProperty({ example: 25 })
  paymentCount!: number;

  @ApiProperty({ example: 13200 })
  averageTicket!: number;

  @ApiProperty({ type: [IncomeByMethodDto] })
  byMethod!: IncomeByMethodDto[];

  @ApiProperty({ type: [IncomeByDayDto] })
  byDay!: IncomeByDayDto[];

  @ApiProperty({ example: 300000 })
  previousPeriodTotal!: number;

  @ApiProperty({ example: 10 })
  changePercentage!: number;
}
