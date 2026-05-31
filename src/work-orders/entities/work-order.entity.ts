import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { Priority } from '../../common/enums/priority.enum';
import { WorkOrderLocation } from '../enums/work-order-location.enum';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { ServiceType } from '../../service-types/entities/service-type.entity';
import { WorkOrderNote } from './work-order-note.entity';
import { WorkOrderMaterial } from './work-order-material.entity';

@Entity('work_orders')
export class WorkOrder extends BaseEntity {
  @Column({ name: 'tracking_code', unique: true })
  trackingCode!: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  status!: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority!: Priority;

  @Column({
    type: 'enum',
    enum: WorkOrderLocation,
    default: WorkOrderLocation.WORKSHOP,
  })
  location!: WorkOrderLocation;

  @Column({ nullable: true })
  diagnosis!: string;

  @Column({ name: 'warranty_until', type: 'date', nullable: true })
  warrantyUntil!: Date;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate!: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @Column({ name: 'client_id' })
  clientId!: string;

  @ManyToOne(() => ServiceType, { nullable: false })
  @JoinColumn({ name: 'service_type_id' })
  serviceType!: ServiceType;

  @Column({ name: 'service_type_id' })
  serviceTypeId!: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'work_order_technicians',
    joinColumn: { name: 'work_order_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  technicians!: User[];

  @OneToMany(() => WorkOrderNote, (note) => note.workOrder, { cascade: true })
  notes!: WorkOrderNote[];

  @OneToMany(() => WorkOrderMaterial, (material) => material.workOrder, {
    cascade: true,
  })
  materials!: WorkOrderMaterial[];
}
