import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MercadoPagoWebhookDto {
  @ApiPropertyOptional({ example: 'payment' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: { id: '12345678' } })
  @IsOptional()
  data?: {
    id?: string;
  };

  @ApiPropertyOptional({ example: 'payment.created' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  api_version?: number;

  @ApiPropertyOptional({ example: '2026-06-02T14:30:00.000Z' })
  @IsString()
  @IsOptional()
  date_created?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  live_mode?: boolean;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  user_id?: string;
}
