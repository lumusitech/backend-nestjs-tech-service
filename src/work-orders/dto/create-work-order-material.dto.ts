import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkOrderMaterialDto {
  @ApiProperty({ example: 'Cable UTP Cat6 - 50m' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ example: 1500.5 })
  @IsNumber()
  @Min(0)
  unitCost!: number;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  @IsUUID()
  @IsOptional()
  supplierId?: string;
}
