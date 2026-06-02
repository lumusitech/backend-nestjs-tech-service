import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WorkOrder } from './work-order.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tasks')
export class Task extends BaseEntity {
  @ApiProperty({ example: 'Revisar conexión de red' })
  @Column()
  title!: string;

  @ApiProperty({ example: 'Verificar cableado y configuración IP' })
  @Column({ nullable: true })
  description!: string;

  @ApiProperty({ example: false })
  @Column({ name: 'is_completed', default: false })
  isCompleted!: boolean;

  @ApiProperty({ example: '2026-06-10T15:30:00.000Z' })
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.tasks, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @ApiProperty({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo!: User;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @Column({ name: 'assigned_to', nullable: true })
  assignedToId!: string;
}
