import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  p256dh!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  auth!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userAgent?: string;
}
