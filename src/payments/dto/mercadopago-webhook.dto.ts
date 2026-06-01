import { IsOptional, IsString, IsNumber } from 'class-validator';

export class MercadoPagoWebhookDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  data?: {
    id?: string;
  };

  @IsString()
  @IsOptional()
  action?: string;

  @IsNumber()
  @IsOptional()
  api_version?: number;

  @IsString()
  @IsOptional()
  date_created?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsOptional()
  live_mode?: boolean;

  @IsString()
  @IsOptional()
  user_id?: string;
}
