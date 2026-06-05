import { DataSource } from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';
import { PaymentMethod } from '../../payments/enums/payment-method.enum';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

interface PaymentSeed {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerPaymentId: string | undefined;
  description: string;
  trackingCode: string;
  paidAt: string | undefined;
}

const PAYMENTS: PaymentSeed[] = [
  {
    amount: 85000,
    method: PaymentMethod.CASH,
    status: PaymentStatus.APPROVED,
    provider: 'Efectivo',
    providerPaymentId: undefined,
    description: 'Pago completo por reparación de PC - reemplazo SSD + reinstalación Windows',
    trackingCode: 'TS-PC0001',
    paidAt: '2026-05-12T17:00:00.000Z',
  },
  {
    amount: 120000,
    method: PaymentMethod.TRANSFER,
    status: PaymentStatus.APPROVED,
    provider: 'Transferencia bancaria',
    providerPaymentId: 'TRF-20260518-001',
    description: 'Pago completo por reparación de TV - reemplazo fuente',
    trackingCode: 'TS-TV0004',
    paidAt: '2026-05-18T12:00:00.000Z',
  },
  {
    amount: 180000,
    method: PaymentMethod.CREDIT_CARD,
    status: PaymentStatus.APPROVED,
    provider: 'MercadoPago',
    providerPaymentId: 'MP-20260520-002',
    description: 'Pago por instalación de red WiFi - AP Ubiquiti + configuración',
    trackingCode: 'TS-WF0006',
    paidAt: '2026-05-20T18:00:00.000Z',
  },
  {
    amount: 95000,
    method: PaymentMethod.DEBIT_CARD,
    status: PaymentStatus.APPROVED,
    provider: 'MercadoPago',
    providerPaymentId: 'MP-20260528-003',
    description: 'Pago por instalación de red mesh WiFi 6 - oficina completa',
    trackingCode: 'TS-WF0010',
    paidAt: '2026-05-28T19:00:00.000Z',
  },
  {
    amount: 75000,
    method: PaymentMethod.TRANSFER,
    status: PaymentStatus.APPROVED,
    provider: 'Transferencia bancaria',
    providerPaymentId: 'TRF-20260522-004',
    description: 'Pago por servicio eléctrico - instalación de tomas y protecciones',
    trackingCode: 'TS-EL0012',
    paidAt: '2026-05-22T17:00:00.000Z',
  },
  {
    amount: 350000,
    method: PaymentMethod.CREDIT_CARD,
    status: PaymentStatus.APPROVED,
    provider: 'MercadoPago',
    providerPaymentId: 'MP-20260514-005',
    description: 'Pago por instalación de sistema de cámaras de seguridad completo',
    trackingCode: 'TS-CAM013',
    paidAt: '2026-05-14T18:00:00.000Z',
  },
  {
    amount: 50000,
    method: PaymentMethod.CASH,
    status: PaymentStatus.PENDING,
    provider: 'Efectivo',
    providerPaymentId: undefined,
    description: 'Seña por servicio eléctrico urgente - reparación cortocircuito',
    trackingCode: 'TS-EL0005',
    paidAt: undefined,
  },
  {
    amount: 30000,
    method: PaymentMethod.TRANSFER,
    status: PaymentStatus.PENDING,
    provider: 'Transferencia bancaria',
    providerPaymentId: undefined,
    description: 'Pago pendiente por reparación de notebook - anticipo por repuesto',
    trackingCode: 'TS-NB0002',
    paidAt: undefined,
  },
  {
    amount: 25000,
    method: PaymentMethod.CREDIT_CARD,
    status: PaymentStatus.REJECTED,
    provider: 'MercadoPago',
    providerPaymentId: 'MP-20260530-ERR',
    description: 'Pago rechazado - tarjeta sin fondos suficientes',
    trackingCode: 'TS-PC0008',
    paidAt: undefined,
  },
];

export async function seedPayments(dataSource: DataSource) {
  const paymentRepo = dataSource.getRepository(Payment);
  const workOrderRepo = dataSource.getRepository(WorkOrder);

  for (const pay of PAYMENTS) {
    const workOrder = await workOrderRepo.findOne({
      where: { trackingCode: pay.trackingCode },
    });

    if (!workOrder) {
      console.log('  Work order not found for payment:', pay.trackingCode);
      continue;
    }

    const existing = await paymentRepo.findOne({
      where: {
        description: pay.description,
        workOrderId: workOrder.id,
      },
    });

    if (existing) {
      console.log('  Payment already exists for:', pay.trackingCode);
      continue;
    }

    const payment = paymentRepo.create({
      amount: pay.amount,
      currency: 'ARS',
      method: pay.method,
      status: pay.status,
      provider: pay.provider,
      providerPaymentId: pay.providerPaymentId,
      description: pay.description,
      workOrderId: workOrder.id,
      paidAt: pay.paidAt ? new Date(pay.paidAt) : undefined,
    });

    await paymentRepo.save(payment);
    console.log('  Payment created:', pay.amount, 'ARS -', pay.trackingCode, '-', pay.status);
  }
}
