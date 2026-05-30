import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TECHNICIAN })
  role!: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
