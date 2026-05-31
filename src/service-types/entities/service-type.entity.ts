import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('service_types')
export class ServiceType extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
