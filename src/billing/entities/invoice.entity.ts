import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceConcept } from '../enums/invoice-concept.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { IvaCondition } from '../enums/iva-condition.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @ApiProperty({ example: '0001-00000042' })
  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber!: string;

  @ApiProperty({ enum: InvoiceType, example: InvoiceType.B })
  @Column({ name: 'invoice_type', type: 'enum', enum: InvoiceType })
  invoiceType!: InvoiceType;

  @ApiProperty({ example: 1 })
  @Column({ name: 'point_of_sale', default: 1 })
  pointOfSale!: number;

  @ApiProperty({ enum: InvoiceConcept, example: InvoiceConcept.SERVICES })
  @Column({
    type: 'enum',
    enum: InvoiceConcept,
    default: InvoiceConcept.SERVICES,
  })
  concept!: InvoiceConcept;

  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.DRAFT })
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  @ApiPropertyOptional({ example: '65432109876543' })
  @Column({ nullable: true })
  cae!: string;

  @ApiPropertyOptional({ example: '2026-07-02' })
  @Column({ name: 'cae_expiry', type: 'date', nullable: true })
  caeExpiry!: Date;

  @ApiPropertyOptional({ example: '2026-06-02T14:30:00.000Z' })
  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issuedAt!: Date;

  @ApiPropertyOptional({ example: '2026-06-05T10:00:00.000Z' })
  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date;

  @ApiProperty({ example: 'Juan Perez' })
  @Column({ name: 'client_name' })
  clientName!: string;

  @ApiPropertyOptional({ example: '20-12345678-9' })
  @Column({ name: 'client_cuit', nullable: true })
  clientCuit!: string;

  @ApiProperty({ example: 'Av. Corrientes 1234, CABA' })
  @Column({ name: 'client_address' })
  clientAddress!: string;

  @ApiProperty({ enum: IvaCondition, example: IvaCondition.CONSUMIDOR_FINAL })
  @Column({
    name: 'client_iva_condition',
    type: 'enum',
    enum: IvaCondition,
    default: IvaCondition.CONSUMIDOR_FINAL,
  })
  clientIvaCondition!: IvaCondition;

  @ApiProperty({ example: 10000.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  @ApiProperty({ example: 2100.0 })
  @Column({
    name: 'iva_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  ivaAmount!: number;

  @ApiProperty({ example: 12100.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @ManyToOne(() => WorkOrder, { nullable: false })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @Column({ name: 'payment_id', nullable: true })
  paymentId!: string;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;
}
