import { ApiProperty } from '@nestjs/swagger';

export class BudgetItemDto {
  @ApiProperty({ example: 'Fuente de poder 500W' })
  description!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 15000 })
  unitPrice!: number;

  @ApiProperty({ example: 15000 })
  subtotal!: number;
}

export class BudgetReportDto {
  @ApiProperty({ example: 'PRES-000123' })
  budgetNumber!: string;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  date!: Date;

  @ApiProperty({ example: '2026-02-15T10:00:00.000Z' })
  validUntil!: Date;

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Tech Service SRL' },
      address: { type: 'string', example: 'Av. Principal 456' },
      phone: { type: 'string', example: '+54 11 9876-5432' },
      email: { type: 'string', example: 'info@techservice.com' },
    },
  })
  businessInfo!: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Juan Pérez' },
      email: { type: 'string', example: 'juan@example.com' },
      phone: { type: 'string', example: '+54 11 1234-5678' },
      address: { type: 'string', example: 'Av. Corrientes 1234' },
    },
  })
  client!: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      trackingCode: { type: 'string', example: 'TS-A1B2C3' },
      serviceTypeName: { type: 'string', example: 'Reparación de PC' },
      diagnosis: {
        type: 'string',
        nullable: true,
        example: 'Fuente de poder dañada',
      },
      scheduledDate: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2026-01-18T10:00:00.000Z',
      },
    },
  })
  workOrder!: {
    trackingCode: string;
    serviceTypeName: string;
    diagnosis: string | null;
    scheduledDate: Date | null;
  };

  @ApiProperty({ type: [BudgetItemDto] })
  items!: BudgetItemDto[];

  @ApiProperty({ example: 5000 })
  laborCost!: number;

  @ApiProperty({ example: 20000 })
  subtotal!: number;

  @ApiProperty({ example: 20000 })
  total!: number;

  @ApiProperty({ example: 'Presupuesto válido por 30 días' })
  notes!: string;
}

export class ReceiptReportDto {
  @ApiProperty({ example: 'REC-000456' })
  receiptNumber!: string;

  @ApiProperty({ example: '2026-01-20T15:00:00.000Z' })
  date!: Date;

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Tech Service SRL' },
      address: { type: 'string', example: 'Av. Principal 456' },
      phone: { type: 'string', example: '+54 11 9876-5432' },
      email: { type: 'string', example: 'info@techservice.com' },
    },
  })
  businessInfo!: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      name: { type: 'string', example: 'Juan Pérez' },
      email: { type: 'string', example: 'juan@example.com' },
    },
  })
  client!: {
    name: string;
    email: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      trackingCode: { type: 'string', example: 'TS-A1B2C3' },
      serviceTypeName: { type: 'string', example: 'Reparación de PC' },
    },
  })
  workOrder!: {
    trackingCode: string;
    serviceTypeName: string;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      amount: { type: 'number', example: 12500 },
      method: { type: 'string', example: 'cash' },
      status: { type: 'string', example: 'approved' },
      paidAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-01-20T15:00:00.000Z',
      },
      providerPaymentId: { type: 'string', nullable: true, example: null },
      installmentNumber: { type: 'number', example: 1 },
      totalInstallments: { type: 'number', example: 1 },
    },
  })
  payment!: {
    amount: number;
    method: string;
    status: string;
    paidAt: Date;
    providerPaymentId: string | null;
    installmentNumber: number;
    totalInstallments: number;
  };
}
