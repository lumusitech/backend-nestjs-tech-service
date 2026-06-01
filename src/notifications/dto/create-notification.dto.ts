import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
