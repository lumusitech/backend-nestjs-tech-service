import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PortalTaskDto {
  @ApiProperty({ example: 'Reemplazar fuente de poder' })
  title!: string;

  @ApiProperty({ example: 'Fuente de 500W dañada por sobrevoltaje' })
  description!: string;

  @ApiProperty({ example: false })
  isCompleted!: boolean;

  @ApiPropertyOptional({ example: '2026-01-20T14:30:00.000Z' })
  completedAt!: Date | null;
}
