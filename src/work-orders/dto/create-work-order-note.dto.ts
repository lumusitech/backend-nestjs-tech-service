import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { NoteType } from '../enums/note-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkOrderNoteDto {
  @ApiProperty({ enum: NoteType, example: NoteType.OBSERVATION })
  @IsEnum(NoteType)
  type!: NoteType;

  @ApiProperty({ example: 'Se realizó diagnóstico inicial del equipo' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
