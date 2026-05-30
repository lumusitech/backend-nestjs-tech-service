import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  contact!: string;

  @Column()
  phone!: string;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  notes!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
