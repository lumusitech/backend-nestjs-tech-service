import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('user_preferences')
export class UserPreference extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ name: 'user_id', unique: true })
  userId!: string;

  @ApiProperty({ example: 'light' })
  @Column({ default: 'light' })
  theme!: string;

  @ApiProperty({ example: 'es' })
  @Column({ default: 'es' })
  language!: string;

  @ApiPropertyOptional({
    example: {
      dashboardLayout: ['kpis', 'pendingItems', 'charts'],
      dashboardWidgets: { kpis: true, pendingItems: true },
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  preferences!: Record<string, unknown>;
}
