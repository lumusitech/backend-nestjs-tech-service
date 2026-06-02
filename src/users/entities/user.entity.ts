import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ example: 'John Doe' })
  @Column()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TECHNICIAN })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.TECHNICIAN })
  role!: UserRole;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
