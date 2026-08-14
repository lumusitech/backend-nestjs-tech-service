import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface BulkExpenseDeleteResult {
  succeeded: { id: string }[];
  failed: { id: string; reason: string }[];
}

export class BulkDeleteExpensesDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of expense IDs to soft delete',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
