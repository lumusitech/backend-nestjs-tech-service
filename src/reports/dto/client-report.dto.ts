import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientReportKpisDto {
  @ApiProperty({ example: 12 })
  totalWorkOrders!: number;

  @ApiProperty({ example: 10 })
  completedOrders!: number;

  @ApiProperty({ example: 150000 })
  totalSpent!: number;

  @ApiProperty({ example: 25000 })
  outstandingDebt!: number;

  @ApiProperty({ example: 12500 })
  averageTicket!: number;

  @ApiPropertyOptional({ example: '2026-05-15T10:00:00.000Z' })
  lastServiceDate!: Date | null;

  @ApiProperty({ example: true })
  isRecurrent!: boolean;
}

export class ClientWorkOrderDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'TS-A1B2C3' })
  trackingCode!: string;

  @ApiProperty({ example: 'completed' })
  status!: string;

  @ApiProperty({ example: 'Reparación de PC' })
  serviceTypeName!: string;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ example: '2026-01-20T14:30:00.000Z' })
  completedAt!: Date | null;

  @ApiProperty({ example: 12500 })
  totalPaid!: number;

  @ApiProperty({ example: 0 })
  pendingAmount!: number;

  @ApiProperty({ example: 3500 })
  materialsCost!: number;
}

export class ClientPaymentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id!: string;

  @ApiProperty({ example: 12500 })
  amount!: number;

  @ApiProperty({ example: 'cash' })
  method!: string;

  @ApiProperty({ example: 'approved' })
  status!: string;

  @ApiPropertyOptional({ example: '2026-01-20T15:00:00.000Z' })
  paidAt!: Date | null;

  @ApiProperty({ example: 'TS-A1B2C3' })
  trackingCode!: string;
}

export class ClientReportDto {
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
      name: { type: 'string', example: 'Juan Pérez' },
      email: { type: 'string', example: 'juan@example.com' },
      phone: { type: 'string', example: '+54 11 1234-5678' },
      address: { type: 'string', example: 'Av. Corrientes 1234' },
    },
  })
  client!: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  @ApiProperty({ type: ClientReportKpisDto })
  kpis!: ClientReportKpisDto;

  @ApiProperty({ type: [ClientWorkOrderDto] })
  workOrders!: ClientWorkOrderDto[];

  @ApiProperty({ type: [ClientPaymentDto] })
  paymentHistory!: ClientPaymentDto[];
}
