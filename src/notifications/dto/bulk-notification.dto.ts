import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkReadNotificationsDto {
  @ApiProperty({
    type: [String],
    example: ['6e7d2a1b-9c8f-4a3b-8f2e-1c2d3e4f5a6b'],
    description: 'List of notification IDs to mark as read',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
