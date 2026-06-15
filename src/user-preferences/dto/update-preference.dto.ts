import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePreferenceDto {
  @ApiPropertyOptional({ example: 'dark' })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    example: {
      dashboardLayout: ['kpis', 'pendingItems', 'charts'],
      dashboardWidgets: { kpis: true, pendingItems: true },
    },
  })
  @IsObject()
  @IsOptional()
  preferences?: Record<string, unknown>;
}
