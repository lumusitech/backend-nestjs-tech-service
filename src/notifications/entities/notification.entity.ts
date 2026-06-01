import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId!: string;

  @Column({ name: 'reference_type', nullable: true })
  referenceType!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt!: Date;
}
