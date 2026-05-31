import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { NoteType } from '../enums/note-type.enum';

export class CreateWorkOrderNoteDto {
  @IsEnum(NoteType)
  type!: NoteType;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
