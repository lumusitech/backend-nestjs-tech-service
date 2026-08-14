import { IsArray, ArrayNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';

export interface BulkPaymentStatusResult {
  succeeded: { id: string; status: PaymentStatus }[];
  failed: { id: string; reason: string }[];
}

export interface BulkPaymentDeleteResult {
  succeeded: { id: string }[];
  failed: { id: string; reason: string }[];
}

export class BulkUpdatePaymentStatusDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of payment IDs to update',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.APPROVED,
  })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}

export class BulkDeletePaymentsDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of payment IDs to soft delete',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
