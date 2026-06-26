import { DataSource } from 'typeorm';
import { Invoice } from '../../billing/entities/invoice.entity';
import { InvoiceType } from '../../billing/enums/invoice-type.enum';
import { InvoiceConcept } from '../../billing/enums/invoice-concept.enum';
import { InvoiceStatus } from '../../billing/enums/invoice-status.enum';
import { IvaCondition } from '../../billing/enums/iva-condition.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

interface InvoiceSeed {
  invoiceNumber: string;
  invoiceType: InvoiceType;
  concept: InvoiceConcept;
  status: InvoiceStatus;
  clientName: string;
  clientCuit: string | undefined;
  clientAddress: string;
  clientIvaCondition: IvaCondition;
  subtotal: number;
  ivaAmount: number;
  total: number;
  trackingCode: string;
  issuedAt: string | undefined;
}

const INVOICES: InvoiceSeed[] = [
  {
    invoiceNumber: '0001-00000001',
    invoiceType: InvoiceType.B,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.ISSUED,
    clientName: 'Juan Pérez',
    clientCuit: '20-30123456-9',
    clientAddress: 'Av. Corrientes 1234, CABA',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 70247.93,
    ivaAmount: 14752.07,
    total: 85000,
    trackingCode: 'TS-PC0001',
    issuedAt: '2026-05-12T17:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000002',
    invoiceType: InvoiceType.A,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.ISSUED,
    clientName: 'Luciana Martínez',
    clientCuit: '27-33456789-2',
    clientAddress: 'Calle Falsa 123, Lanús, GBA',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 99173.55,
    ivaAmount: 20826.45,
    total: 120000,
    trackingCode: 'TS-TV0004',
    issuedAt: '2026-05-18T12:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000003',
    invoiceType: InvoiceType.A,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.ISSUED,
    clientName: 'Valentina Torres',
    clientCuit: '27-35678901-4',
    clientAddress: 'Av. Cabildo 1500, CABA',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 148760.33,
    ivaAmount: 31239.67,
    total: 180000,
    trackingCode: 'TS-WF0006',
    issuedAt: '2026-05-20T18:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000004',
    invoiceType: InvoiceType.A,
    concept: InvoiceConcept.BOTH,
    status: InvoiceStatus.ISSUED,
    clientName: 'Isabella López',
    clientCuit: '27-39012345-8',
    clientAddress: 'Av. San Martín 1234, San Martín, GBA',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 78512.40,
    ivaAmount: 16487.60,
    total: 95000,
    trackingCode: 'TS-WF0010',
    issuedAt: '2026-05-28T19:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000005',
    invoiceType: InvoiceType.B,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.ISSUED,
    clientName: 'Sofía Castro',
    clientCuit: '27-41234567-0',
    clientAddress: 'Av. Pellegrini 789, Rosario, Santa Fe',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 61983.47,
    ivaAmount: 13016.53,
    total: 75000,
    trackingCode: 'TS-EL0012',
    issuedAt: '2026-05-22T17:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000006',
    invoiceType: InvoiceType.A,
    concept: InvoiceConcept.BOTH,
    status: InvoiceStatus.ISSUED,
    clientName: 'Benjamín Moreno',
    clientCuit: '20-42345678-1',
    clientAddress: 'Av. Colón 1234, Córdoba Capital',
    clientIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
    subtotal: 289256.20,
    ivaAmount: 60743.80,
    total: 350000,
    trackingCode: 'TS-CAM013',
    issuedAt: '2026-05-14T18:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000007',
    invoiceType: InvoiceType.B,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.DRAFT,
    clientName: 'Fernando Díaz',
    clientCuit: '20-34567890-3',
    clientAddress: 'Av. Belgrano 2345, CABA',
    clientIvaCondition: IvaCondition.MONOTRIBUTO,
    subtotal: 120000,
    ivaAmount: 0,
    total: 120000,
    trackingCode: 'TS-EL0005',
    issuedAt: undefined,
  },
  {
    invoiceNumber: '0001-00000008',
    invoiceType: InvoiceType.C,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.CANCELLED,
    clientName: 'Martín Romero',
    clientCuit: '20-36789012-5',
    clientAddress: 'Av. Libertador 3456, Vicente López, GBA',
    clientIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
    subtotal: 45000,
    ivaAmount: 9450,
    total: 54450,
    trackingCode: 'TS-MT0007',
    issuedAt: undefined,
  },
  {
    invoiceNumber: '0001-00000009',
    invoiceType: InvoiceType.A,
    concept: InvoiceConcept.BOTH,
    status: InvoiceStatus.ISSUED,
    clientName: 'Roberto González',
    clientCuit: '20-45678901-2',
    clientAddress: 'Av. Rivadavia 4567, Flores, CABA',
    clientIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
    subtotal: 289256.20,
    ivaAmount: 60743.80,
    total: 350000,
    trackingCode: 'TS-CAM003',
    issuedAt: '2026-06-10T14:30:00.000Z',
  },
  {
    invoiceNumber: '0001-00000010',
    invoiceType: InvoiceType.B,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.ISSUED,
    clientName: 'Santiago Álvarez',
    clientCuit: '20-47890123-4',
    clientAddress: 'Av. Entre Ríos 789, La Boca, CABA',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 78512.40,
    ivaAmount: 16487.60,
    total: 95000,
    trackingCode: 'TS-NB0009',
    issuedAt: '2026-06-15T17:00:00.000Z',
  },
  {
    invoiceNumber: '0001-00000011',
    invoiceType: InvoiceType.C,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.REJECTED,
    clientName: 'Mateo Ruiz',
    clientCuit: '20-49012345-6',
    clientAddress: 'Av. Corrientes 5678, Balvanera, CABA',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 70247.93,
    ivaAmount: 14752.07,
    total: 85000,
    trackingCode: 'TS-TV0011',
    issuedAt: undefined,
  },
];

export async function seedInvoices(dataSource: DataSource) {
  const invoiceRepo = dataSource.getRepository(Invoice);
  const workOrderRepo = dataSource.getRepository(WorkOrder);

  for (const inv of INVOICES) {
    const existing = await invoiceRepo.findOne({
      where: { invoiceNumber: inv.invoiceNumber },
    });

    if (existing) {
      console.log('  Invoice already exists:', inv.invoiceNumber);
      continue;
    }

    const workOrder = await workOrderRepo.findOne({
      where: { trackingCode: inv.trackingCode },
    });

    if (!workOrder) {
      console.log('  Work order not found for invoice:', inv.trackingCode);
      continue;
    }

    const invoice = invoiceRepo.create({
      invoiceNumber: inv.invoiceNumber,
      invoiceType: inv.invoiceType,
      pointOfSale: 1,
      concept: inv.concept,
      status: inv.status,
      clientName: inv.clientName,
      clientCuit: inv.clientCuit,
      clientAddress: inv.clientAddress,
      clientIvaCondition: inv.clientIvaCondition,
      subtotal: inv.subtotal,
      ivaAmount: inv.ivaAmount,
      total: inv.total,
      workOrderId: workOrder.id,
      issuedAt: inv.issuedAt ? new Date(inv.issuedAt) : undefined,
    });

    await invoiceRepo.save(invoice);
    console.log('  Invoice created:', inv.invoiceNumber, '-', inv.status);
  }
}
