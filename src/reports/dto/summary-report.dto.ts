export class KpiDto {
  totalIncome!: number;
  totalExpenses!: number;
  totalMaterialCosts!: number;
  netProfit!: number;
  averageTicket!: number;
  workOrderCount!: number;
  completedCount!: number;
  completionRate!: number;
  averageResolutionDays!: number;
  collectionRate!: number;
}

export class MonthlyTrendDto {
  labels!: string[];
  income!: number[];
  expenses!: number[];
  profit!: number[];
  workOrderCount!: number[];
}

export class StatusCountDto {
  status!: string;
  label!: string;
  count!: number;
  percentage!: number;
}

export class TopServiceDto {
  name!: string;
  count!: number;
  revenue!: number;
}

export class PaymentMethodDistDto {
  method!: string;
  label!: string;
  count!: number;
  total!: number;
  percentage!: number;
}

export class TopClientDto {
  clientId!: string;
  clientName!: string;
  workOrderCount!: number;
  totalSpent!: number;
  lastWorkOrderDate!: Date;
}

export class TechnicianPerfDto {
  technicianId!: string;
  name!: string;
  completedOrders!: number;
  averageResolutionDays!: number;
  totalRevenue!: number;
}

export class PriorityCountDto {
  priority!: string;
  label!: string;
  count!: number;
}

export class TrendsDto {
  incomeChange!: number;
  ordersChange!: number;
  profitChange!: number;
  averageTicketChange!: number;
}

export class SummaryReportDto {
  kpis!: KpiDto;
  monthlyTrend!: MonthlyTrendDto;
  workOrdersByStatus!: StatusCountDto[];
  topServices!: TopServiceDto[];
  paymentMethodDistribution!: PaymentMethodDistDto[];
  topClients!: TopClientDto[];
  technicianPerformance!: TechnicianPerfDto[];
  workOrdersByPriority!: PriorityCountDto[];
  trends!: TrendsDto;
}
