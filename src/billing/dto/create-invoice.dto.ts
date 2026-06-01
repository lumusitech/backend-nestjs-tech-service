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
import { InvoiceType } from '../enums/invoice-type.enum';
import { InvoiceConcept } from '../enums/invoice-concept.enum';
import { IvaCondition } from '../enums/iva-condition.enum';

export class CreateInvoiceDto {
  @IsEnum(InvoiceType)
  invoiceType!: InvoiceType;

  @IsInt()
  @Min(1)
  @IsOptional()
  pointOfSale?: number;

  @IsEnum(InvoiceConcept)
  @IsOptional()
  concept?: InvoiceConcept;

  @IsString()
  @IsNotEmpty()
  clientName!: string;

  @IsString()
  @IsOptional()
  clientCuit?: string;

  @IsString()
  @IsNotEmpty()
  clientAddress!: string;

  @IsEnum(IvaCondition)
  @IsOptional()
  clientIvaCondition?: IvaCondition;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  ivaAmount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  total!: number;

  @IsUUID()
  workOrderId!: string;

  @IsUUID()
  @IsOptional()
  paymentId?: string;
}
