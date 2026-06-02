import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @ApiProperty({ example: 'Distribuidora XYZ' })
  @Column()
  name!: string;

  @ApiProperty({ example: 'Carlos López' })
  @Column()
  contact!: string;

  @ApiProperty({ example: '+5491198765432' })
  @Column()
  phone!: string;

  @ApiPropertyOptional({ example: 'contacto@xyz.com' })
  @Column({ unique: true, nullable: true })
  email!: string;

  @ApiProperty({ example: 'Av. San Martín 567, Buenos Aires' })
  @Column()
  address!: string;

  @ApiPropertyOptional({ example: 'Proveedor de cámaras Hikvision' })
  @Column({ nullable: true })
  notes!: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
