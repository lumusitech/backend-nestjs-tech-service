import { IsString, IsOptional, IsEmail, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBusinessSettingDto {
  @ApiPropertyOptional({ example: 'Tech Service' })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiPropertyOptional({ example: 'Av. San Martín 567, Buenos Aires' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '+5491198765432' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@techservice.com' })
  @ValidateIf((o) => o.email !== '' && o.email !== undefined)
  @IsEmail()
  @IsOptional()
  email?: string;
}
