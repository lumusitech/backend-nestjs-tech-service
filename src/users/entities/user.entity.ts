import { Entity, Column, JoinTable, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../enums/user-role.enum';
import { Skill } from '../../skills/entities/skill.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: '+5491123456789' })
  @Column({ nullable: true })
  phone?: string;

  @ApiPropertyOptional({ example: 5.0 })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 5.0 })
  commission?: number;

  @ApiPropertyOptional({ example: '5 años en soporte técnico' })
  @Column({ type: 'text', nullable: true })
  experience?: string;

  @ApiPropertyOptional({ example: 4.5 })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  trustRating?: number;

  @ManyToMany(() => Skill)
  @JoinTable({
    name: 'user_skills',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills?: Skill[];
}
