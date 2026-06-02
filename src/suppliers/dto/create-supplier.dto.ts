import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuidora XYZ' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Carlos López' })
  @IsString()
  @IsNotEmpty()
  contact!: string;

  @ApiProperty({ example: '+5491198765432' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'contacto@xyz.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Av. San Martín 567, Buenos Aires' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ example: 'Proveedor de cámaras Hikvision' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
