import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';

export class FilterInvoiceDto extends PaginationDto {
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @IsEnum(InvoiceType)
  @IsOptional()
  invoiceType?: InvoiceType;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  clientName?: string;
}
