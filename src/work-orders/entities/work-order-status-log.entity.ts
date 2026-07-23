import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { User } from '../../users/entities/user.entity';
import { WorkOrder } from './work-order.entity';

@Entity('work_order_status_logs')
export class WorkOrderStatusLog extends BaseEntity {
  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder?: WorkOrder;

  @Column({
    name: 'from_status',
    type: 'varchar',
    nullable: true,
  })
  fromStatus!: WorkOrderStatus | null;

  @Column({
    name: 'to_status',
    type: 'varchar',
  })
  toStatus!: WorkOrderStatus;

  @Column({ name: 'changed_by_user_id' })
  changedByUserId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'changed_by_user_id' })
  changedBy?: User;

  @Column({ name: 'changed_by_role' })
  changedByRole!: string;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  @Column({ nullable: true })
  duration!: number | null;
}
