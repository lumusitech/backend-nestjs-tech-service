import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column({ name: 'internet_provider', nullable: true })
  internetProvider!: string;

  @Column({ name: 'internet_plan', nullable: true })
  internetPlan!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
