export class ClientReportKpisDto {
  totalWorkOrders!: number;
  completedOrders!: number;
  totalSpent!: number;
  outstandingDebt!: number;
  averageTicket!: number;
  lastServiceDate!: Date | null;
  isRecurrent!: boolean;
}

export class ClientWorkOrderDto {
  id!: string;
  trackingCode!: string;
  status!: string;
  serviceTypeName!: string;
  createdAt!: Date;
  completedAt!: Date | null;
  totalPaid!: number;
  pendingAmount!: number;
  materialsCost!: number;
}

export class ClientPaymentDto {
  id!: string;
  amount!: number;
  method!: string;
  status!: string;
  paidAt!: Date | null;
  trackingCode!: string;
}

export class ClientReportDto {
  client!: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  kpis!: ClientReportKpisDto;
  workOrders!: ClientWorkOrderDto[];
  paymentHistory!: ClientPaymentDto[];
}
