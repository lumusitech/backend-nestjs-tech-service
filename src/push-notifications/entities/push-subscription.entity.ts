import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscription extends BaseEntity {
  @ApiProperty()
  @Column()
  endpoint!: string;

  @ApiProperty()
  @Column()
  p256dh!: string;

  @ApiProperty()
  @Column()
  auth!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ApiProperty()
  @Column({ name: 'user_id' })
  userId!: string;

  @ApiProperty({ required: false })
  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;
}
