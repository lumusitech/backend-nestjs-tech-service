import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @ApiProperty({ example: 1500.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @ApiProperty({ example: 'ARS' })
  @Column({ default: 'ARS' })
  currency!: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @ApiProperty({ example: 'MercadoPago' })
  @Column()
  provider!: string;

  @ApiPropertyOptional({ example: 'MP-12345678' })
  @Column({ name: 'provider_payment_id', nullable: true })
  providerPaymentId!: string;

  @ApiPropertyOptional({ example: 'Payment for camera installation' })
  @Column({ nullable: true })
  description!: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'installment_number', default: 1 })
  installmentNumber!: number;

  @ApiProperty({ example: 1 })
  @Column({ name: 'total_installments', default: 1 })
  totalInstallments!: number;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: Date;

  @ApiPropertyOptional({ example: '2026-06-02T14:30:00.000Z' })
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt!: Date;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.payments, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @Column({ name: 'work_order_id' })
  workOrderId!: string;
}
