import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { IvaCondition } from '../../billing/enums/iva-condition.enum';

@Entity('clients')
export class Client extends BaseEntity {
  @ApiProperty({ example: 'Juan Pérez' })
  @Column()
  name!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @Column({ unique: true })
  email!: string;

  @ApiProperty({ example: '+5491112345678' })
  @Column()
  phone!: string;

  @ApiProperty({ example: 'Av. Corrientes 1234, CABA' })
  @Column()
  address!: string;

  @ApiPropertyOptional({ example: 'Fibertel' })
  @Column({ name: 'internet_provider', nullable: true })
  internetProvider!: string;

  @ApiPropertyOptional({ example: '100Mbps' })
  @Column({ name: 'internet_plan', nullable: true })
  internetPlan!: string;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @ApiPropertyOptional({ example: '20-12345678-9' })
  @Column({ nullable: true })
  cuit!: string;

  @ApiPropertyOptional({
    enum: IvaCondition,
    example: IvaCondition.RESPONSABLE_INSCRIPTO,
  })
  @Column({
    name: 'iva_condition',
    type: 'enum',
    enum: IvaCondition,
    nullable: true,
  })
  ivaCondition!: IvaCondition;
}
