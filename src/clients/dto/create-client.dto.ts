import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { IvaCondition } from '../../billing/enums/iva-condition.enum';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  internetProvider?: string;

  @IsString()
  @IsOptional()
  internetPlan?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  cuit?: string;

  @IsEnum(IvaCondition)
  @IsOptional()
  ivaCondition?: IvaCondition;
}
