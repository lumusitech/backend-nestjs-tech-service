import { ApiProperty } from '@nestjs/swagger';

export class KpiDto {
  @ApiProperty({ example: 500000 })
  totalIncome!: number;

  @ApiProperty({ example: 200000 })
  totalExpenses!: number;

  @ApiProperty({ example: 120000 })
  totalMaterialCosts!: number;

  @ApiProperty({ example: 180000 })
  netProfit!: number;

  @ApiProperty({ example: 12500 })
  averageTicket!: number;

  @ApiProperty({ example: 40 })
  workOrderCount!: number;

  @ApiProperty({ example: 35 })
  completedCount!: number;

  @ApiProperty({ example: 87.5 })
  completionRate!: number;

  @ApiProperty({ example: 3.2 })
  averageResolutionDays!: number;

  @ApiProperty({ example: 92.3 })
  collectionRate!: number;
}

export class MonthlyTrendDto {
  @ApiProperty({ example: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'] })
  labels!: string[];

  @ApiProperty({ example: [80000, 95000, 70000, 110000, 85000, 60000] })
  income!: number[];

  @ApiProperty({ example: [30000, 35000, 28000, 40000, 32000, 25000] })
  expenses!: number[];

  @ApiProperty({ example: [50000, 60000, 42000, 70000, 53000, 35000] })
  profit!: number[];

  @ApiProperty({ example: [7, 8, 6, 9, 7, 5] })
  workOrderCount!: number[];
}

export class StatusCountDto {
  @ApiProperty({ example: 'completed' })
  status!: string;

  @ApiProperty({ example: 'Completado' })
  label!: string;

  @ApiProperty({ example: 35 })
  count!: number;

  @ApiProperty({ example: 70 })
  percentage!: number;
}

export class TopServiceDto {
  @ApiProperty({ example: 'Reparación de PC' })
  name!: string;

  @ApiProperty({ example: 15 })
  count!: number;

  @ApiProperty({ example: 187500 })
  revenue!: number;
}

export class PaymentMethodDistDto {
  @ApiProperty({ example: 'cash' })
  method!: string;

  @ApiProperty({ example: 'Efectivo' })
  label!: string;

  @ApiProperty({ example: 20 })
  count!: number;

  @ApiProperty({ example: 250000 })
  total!: number;

  @ApiProperty({ example: 50 })
  percentage!: number;
}

export class TopClientDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  clientId!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  clientName!: string;

  @ApiProperty({ example: 8 })
  workOrderCount!: number;

  @ApiProperty({ example: 96000 })
  totalSpent!: number;

  @ApiProperty({ example: '2026-05-15T10:00:00.000Z' })
  lastWorkOrderDate!: Date;
}

export class TechnicianPerfDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  technicianId!: string;

  @ApiProperty({ example: 'Carlos López' })
  name!: string;

  @ApiProperty({ example: 20 })
  completedOrders!: number;

  @ApiProperty({ example: 2.8 })
  averageResolutionDays!: number;

  @ApiProperty({ example: 240000 })
  totalRevenue!: number;
}

export class PriorityCountDto {
  @ApiProperty({ example: 'high' })
  priority!: string;

  @ApiProperty({ example: 'Alta' })
  label!: string;

  @ApiProperty({ example: 10 })
  count!: number;
}

export class TrendsDto {
  @ApiProperty({ example: 8.5 })
  incomeChange!: number;

  @ApiProperty({ example: -3.2 })
  ordersChange!: number;

  @ApiProperty({ example: 12.1 })
  profitChange!: number;

  @ApiProperty({ example: 5.0 })
  averageTicketChange!: number;
}

export class SummaryReportDto {
  @ApiProperty({ type: KpiDto })
  kpis!: KpiDto;

  @ApiProperty({ type: MonthlyTrendDto })
  monthlyTrend!: MonthlyTrendDto;

  @ApiProperty({ type: [StatusCountDto] })
  workOrdersByStatus!: StatusCountDto[];

  @ApiProperty({ type: [TopServiceDto] })
  topServices!: TopServiceDto[];

  @ApiProperty({ type: [PaymentMethodDistDto] })
  paymentMethodDistribution!: PaymentMethodDistDto[];

  @ApiProperty({ type: [TopClientDto] })
  topClients!: TopClientDto[];

  @ApiProperty({ type: [TechnicianPerfDto] })
  technicianPerformance!: TechnicianPerfDto[];

  @ApiProperty({ type: [PriorityCountDto] })
  workOrdersByPriority!: PriorityCountDto[];

  @ApiProperty({ type: TrendsDto })
  trends!: TrendsDto;
}
