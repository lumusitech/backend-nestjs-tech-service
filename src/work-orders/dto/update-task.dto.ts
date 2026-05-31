import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
