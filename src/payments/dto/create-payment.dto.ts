import {
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: 1500.5, minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ example: 'MercadoPago' })
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @ApiPropertyOptional({ example: 'Payment for camera installation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  installmentNumber?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalInstallments?: number;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
