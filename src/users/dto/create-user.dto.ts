import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MinLength,
  IsArray,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.TECHNICIAN })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: '+5491123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 5.0, description: 'Commission percentage (sellers)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission?: number;

  @ApiPropertyOptional({ example: '5 años en soporte técnico' })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ example: 4.5, description: 'Trust rating 1-5' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  trustRating?: number;

  @ApiPropertyOptional({ example: ['uuid1', 'uuid2'], description: 'Skill IDs (technicians)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];
}
