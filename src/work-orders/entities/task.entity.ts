import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WorkOrder } from './work-order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'is_completed', default: false })
  isCompleted!: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.tasks, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo!: User;

  @Column({ name: 'assigned_to', nullable: true })
  assignedToId!: string;
}
