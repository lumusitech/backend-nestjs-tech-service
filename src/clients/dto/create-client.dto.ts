import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IvaCondition } from '../../billing/enums/iva-condition.enum';

export class CreateClientDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+5491112345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Av. Corrientes 1234, CABA' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ example: 'Fibertel' })
  @IsString()
  @IsOptional()
  internetProvider?: string;

  @ApiPropertyOptional({ example: '100Mbps' })
  @IsString()
  @IsOptional()
  internetPlan?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '20-12345678-9' })
  @IsString()
  @IsOptional()
  cuit?: string;

  @ApiPropertyOptional({
    enum: IvaCondition,
    example: IvaCondition.RESPONSABLE_INSCRIPTO,
  })
  @IsEnum(IvaCondition)
  @IsOptional()
  ivaCondition?: IvaCondition;
}
