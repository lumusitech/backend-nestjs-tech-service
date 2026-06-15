import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PendingItemType } from '../enums/pending-item-type.enum';
import { PendingItemPriority } from '../enums/pending-item-priority.enum';
import { PendingItemStatus } from '../enums/pending-item-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('pending_items')
export class PendingItem extends BaseEntity {
  @ApiProperty({ example: 'Revisar garantía de repuesto' })
  @Column()
  title!: string;

  @ApiPropertyOptional({
    example: 'Verificar si el repuesto aún tiene garantía del proveedor',
  })
  @Column({ type: 'text', nullable: true })
  description!: string;

  @ApiProperty({ example: '2026-06-20' })
  @Column({ name: 'due_date', type: 'date' })
  dueDate!: Date;

  @ApiProperty({ enum: PendingItemType, example: PendingItemType.WORK_ORDER })
  @Column({ type: 'enum', enum: PendingItemType })
  type!: PendingItemType;

  @ApiProperty({
    enum: PendingItemPriority,
    example: PendingItemPriority.HIGH,
  })
  @Column({
    type: 'enum',
    enum: PendingItemPriority,
    default: PendingItemPriority.MEDIUM,
  })
  priority!: PendingItemPriority;

  @ApiProperty({
    enum: PendingItemStatus,
    example: PendingItemStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: PendingItemStatus,
    default: PendingItemStatus.PENDING,
  })
  status!: PendingItemStatus;

  @ApiPropertyOptional({ example: 'work_order' })
  @Column({ name: 'reference_type', nullable: true })
  referenceType!: string;

  @ApiPropertyOptional({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  @Column({ name: 'reference_id', nullable: true })
  referenceId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo!: User;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ApiPropertyOptional({ example: '2026-06-15T10:00:00.000Z' })
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;
}
