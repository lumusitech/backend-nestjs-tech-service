import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.WORK_ORDER_CREATED,
  })
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ example: 'Nueva orden de trabajo creada' })
  @Column()
  title!: string;

  @ApiProperty({ example: 'Se ha creado la orden de trabajo TS-A1B2C3' })
  @Column({ type: 'text' })
  message!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ name: 'user_id' })
  userId!: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Column({ name: 'reference_id', nullable: true })
  referenceId!: string;

  @ApiPropertyOptional({ example: 'work_order' })
  @Column({ name: 'reference_type', nullable: true })
  referenceType!: string;

  @ApiPropertyOptional({ example: { trackingCode: 'TS-A1B2C3' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;

  @ApiProperty({ example: false })
  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @ApiPropertyOptional({ example: '2026-01-20T14:30:00.000Z' })
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt!: Date;
}
