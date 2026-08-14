import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface BulkInvoiceResultItem {
  id: string;
  status: 'issued' | 'cancelled';
}

export interface BulkInvoiceFailedItem {
  id: string;
  reason: string;
}

export interface BulkInvoiceIssueResult {
  succeeded: BulkInvoiceResultItem[];
  failed: BulkInvoiceFailedItem[];
}

export interface BulkInvoiceCancelResult {
  succeeded: BulkInvoiceResultItem[];
  failed: BulkInvoiceFailedItem[];
}

export class BulkIssueInvoicesDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of invoice IDs to issue',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}

export class BulkCancelInvoicesDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of invoice IDs to cancel',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
