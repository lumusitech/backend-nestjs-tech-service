export class BudgetItemDto {
  description!: string;
  quantity!: number;
  unitPrice!: number;
  subtotal!: number;
}

export class BudgetReportDto {
  budgetNumber!: string;
  date!: Date;
  validUntil!: Date;
  businessInfo!: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  client!: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  workOrder!: {
    trackingCode: string;
    serviceTypeName: string;
    diagnosis: string | null;
    scheduledDate: Date | null;
  };
  items!: BudgetItemDto[];
  laborCost!: number;
  subtotal!: number;
  total!: number;
  notes!: string;
}

export class ReceiptReportDto {
  receiptNumber!: string;
  date!: Date;
  businessInfo!: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  client!: {
    name: string;
    email: string;
  };
  workOrder!: {
    trackingCode: string;
    serviceTypeName: string;
  };
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
