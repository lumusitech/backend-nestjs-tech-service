import { IsOptional, IsEnum, IsDateString, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export class FilterPaymentDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'description', description: 'Search by description, provider or provider payment ID' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.APPROVED })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.TRANSFER })
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @ApiPropertyOptional({ example: 'uuid-work-order', description: 'Filter by work order ID' })
  @IsUUID()
  @IsOptional()
  workOrderId?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'paidAt'], example: 'createdAt', description: 'Date field to filter by' })
  @IsOptional()
  @IsString()
  dateField?: string;
}
