export class PeriodLabelDto {
  from!: string;
  to!: string;
  label!: string;
}

export class IncomeByMethodDto {
  method!: string;
  label!: string;
  total!: number;
  count!: number;
  percentage!: number;
}

export class IncomeByDayDto {
  date!: string;
  total!: number;
}

export class IncomeReportDto {
  period!: PeriodLabelDto;
  totalIncome!: number;
  paymentCount!: number;
  averageTicket!: number;
  byMethod!: IncomeByMethodDto[];
  byDay!: IncomeByDayDto[];
  previousPeriodTotal!: number;
  changePercentage!: number;
}
