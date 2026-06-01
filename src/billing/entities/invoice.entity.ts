import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceConcept } from '../enums/invoice-concept.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { IvaCondition } from '../enums/iva-condition.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber!: string;

  @Column({ name: 'invoice_type', type: 'enum', enum: InvoiceType })
  invoiceType!: InvoiceType;

  @Column({ name: 'point_of_sale', default: 1 })
  pointOfSale!: number;

  @Column({
    type: 'enum',
    enum: InvoiceConcept,
    default: InvoiceConcept.SERVICES,
  })
  concept!: InvoiceConcept;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  @Column({ nullable: true })
  cae!: string;

  @Column({ name: 'cae_expiry', type: 'date', nullable: true })
  caeExpiry!: Date;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issuedAt!: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date;

  @Column({ name: 'client_name' })
  clientName!: string;

  @Column({ name: 'client_cuit', nullable: true })
  clientCuit!: string;

  @Column({ name: 'client_address' })
  clientAddress!: string;

  @Column({
    name: 'client_iva_condition',
    type: 'enum',
    enum: IvaCondition,
    default: IvaCondition.CONSUMIDOR_FINAL,
  })
  clientIvaCondition!: IvaCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({
    name: 'iva_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  ivaAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @ManyToOne(() => WorkOrder, { nullable: false })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ name: 'payment_id', nullable: true })
  paymentId!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;
}
