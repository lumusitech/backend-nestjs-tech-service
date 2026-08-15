import { IsArray, ArrayNotEmpty, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export interface BulkUserStatusResult {
  succeeded: { id: string; isActive: boolean }[];
  failed: { id: string; reason: string }[];
}

export class BulkUpdateUserStatusDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of user IDs to update',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];

  @ApiProperty({ example: false })
  @IsBoolean()
  isActive!: boolean;
}
