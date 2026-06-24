import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('business_settings')
export class BusinessSetting extends BaseEntity {
  @ApiProperty({ example: 'Tech Service' })
  @Column({ name: 'business_name', default: 'Tech Service' })
  businessName!: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @Column({ name: 'logo_url', nullable: true })
  logoUrl!: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @Column({ name: 'primary_color', nullable: true })
  primaryColor!: string;

  @ApiPropertyOptional({ example: '#10B981' })
  @Column({ name: 'secondary_color', nullable: true })
  secondaryColor!: string;

  @ApiPropertyOptional({ example: 'Av. San Martín 567, Buenos Aires' })
  @Column({ nullable: true })
  address!: string;

  @ApiPropertyOptional({ example: '+5491198765432' })
  @Column({ nullable: true })
  phone!: string;

  @ApiPropertyOptional({ example: 'info@techservice.com' })
  @Column({ nullable: true })
  email!: string;
}
