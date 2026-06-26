import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('skills')
export class Skill extends BaseEntity {
  @ApiProperty({ example: 'Redes y Conectividad' })
  @Column({ unique: true })
  name!: string;

  @ApiPropertyOptional({ example: 'Configuración de redes y conectividad' })
  @Column({ nullable: true })
  description?: string;

  @ApiPropertyOptional({ example: 'Redes' })
  @Column({ nullable: true })
  category?: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
