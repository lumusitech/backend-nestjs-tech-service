import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ default: 'ARS' })
  currency!: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column()
  provider!: string;

  @Column({ name: 'provider_payment_id', nullable: true })
  providerPaymentId!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'installment_number', default: 1 })
  installmentNumber!: number;

  @Column({ name: 'total_installments', default: 1 })
  totalInstallments!: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: Date;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.payments, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'work_order_id' })
  workOrderId!: string;
}
