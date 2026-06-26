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
import { Task } from './task.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('work_orders')
export class WorkOrder extends BaseEntity {
  @ApiProperty({ example: 'TS-A1B2C3' })
  @Column({ name: 'tracking_code', unique: true })
  trackingCode!: string;

  @ApiProperty({ enum: WorkOrderStatus, example: WorkOrderStatus.PENDING })
  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  status!: WorkOrderStatus;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority!: Priority;

  @ApiProperty({ enum: WorkOrderLocation, example: WorkOrderLocation.ON_SITE })
  @Column({
    type: 'enum',
    enum: WorkOrderLocation,
    default: WorkOrderLocation.WORKSHOP,
  })
  location!: WorkOrderLocation;

  @ApiProperty({ example: 'Pantalla rota, necesita reemplazo' })
  @Column({ nullable: true })
  diagnosis!: string;

  @ApiProperty({ example: 5.0 })
  @Column({ name: 'commission_percent', type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  commissionPercent!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller?: User;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'seller_id', nullable: true })
  sellerId?: string;

  @ApiProperty({ example: 'Av. Corrientes 1234, Piso 5' })
  @Column({ name: 'work_address', nullable: true })
  workAddress!: string;

  @ApiProperty({ example: '2026-12-31' })
  @Column({ name: 'warranty_until', type: 'date', nullable: true })
  warrantyUntil!: Date;

  @ApiProperty({ example: '2026-06-15' })
  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate!: Date;

  @ApiProperty({ example: '2026-06-10T08:00:00.000Z' })
  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date;

  @ApiProperty({ example: '2026-06-10T17:00:00.000Z' })
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;

  @ManyToOne(() => Client, { nullable: false })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'client_id' })
  clientId!: string;

  @ManyToOne(() => ServiceType, { nullable: false })
  @JoinColumn({ name: 'service_type_id' })
  serviceType!: ServiceType;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
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

  @OneToMany(() => Task, (task) => task.workOrder, { cascade: true })
  tasks!: Task[];

  @OneToMany(() => Payment, (payment) => payment.workOrder)
  payments!: Payment[];
}
