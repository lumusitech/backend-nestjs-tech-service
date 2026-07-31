import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStatusLogDetailDto {
  @ApiPropertyOptional({
    example: 'El cliente se tuvo que ir temprano, coordinar día para terminar',
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  detail?: string;
}
