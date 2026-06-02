import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { InvoiceType } from '../enums/invoice-type.enum';

export class FilterInvoiceDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InvoiceStatus, example: InvoiceStatus.ISSUED })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ enum: InvoiceType, example: InvoiceType.B })
  @IsEnum(InvoiceType)
  @IsOptional()
  invoiceType?: InvoiceType;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'Juan Perez' })
  @IsString()
  @IsOptional()
  clientName?: string;
}
