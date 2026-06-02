import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('service_types')
export class ServiceType extends BaseEntity {
  @ApiProperty({ example: 'Cámara IP Installation' })
  @Column({ unique: true })
  name!: string;

  @ApiProperty({
    example: 'Instalación de cámaras IP con configuración de red',
  })
  @Column({ nullable: true })
  description!: string;

  @ApiProperty({ example: 120 })
  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration!: number;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
