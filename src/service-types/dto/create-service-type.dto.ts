import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceTypeDto {
  @ApiProperty({ example: 'Cámara IP Installation' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Instalación de cámaras IP con configuración de red',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
