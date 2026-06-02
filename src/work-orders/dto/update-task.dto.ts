import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ example: '2026-06-10T15:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
