import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceConcept } from '../enums/invoice-concept.enum';
import { IvaCondition } from '../enums/iva-condition.enum';

export class CreateInvoiceDto {
  @ApiProperty({ enum: InvoiceType, example: InvoiceType.B })
  @IsEnum(InvoiceType)
  invoiceType!: InvoiceType;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  pointOfSale?: number;

  @ApiPropertyOptional({
    enum: InvoiceConcept,
    example: InvoiceConcept.SERVICES,
  })
  @IsEnum(InvoiceConcept)
  @IsOptional()
  concept?: InvoiceConcept;

  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @ApiPropertyOptional({ example: '20-12345678-9' })
  @IsString()
  @IsOptional()
  clientCuit?: string;

  @ApiProperty({ example: 'Av. Corrientes 1234, CABA' })
  @IsString()
  @IsNotEmpty()
  clientAddress!: string;

  @ApiPropertyOptional({
    enum: IvaCondition,
    example: IvaCondition.CONSUMIDOR_FINAL,
  })
  @IsEnum(IvaCondition)
  @IsOptional()
  clientIvaCondition?: IvaCondition;

  @ApiProperty({ example: 10000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal!: number;

  @ApiPropertyOptional({ example: 2100.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  ivaAmount?: number;

  @ApiProperty({ example: 12100.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total!: number;

  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  workOrderId!: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  @IsOptional()
  paymentId?: string;
}
