import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.WORK_ORDER_CREATED,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Nueva orden de trabajo creada' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Se ha creado la orden de trabajo TS-A1B2C3' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'work_order' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ example: { trackingCode: 'TS-A1B2C3' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
