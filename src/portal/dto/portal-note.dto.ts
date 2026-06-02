import { ApiProperty } from '@nestjs/swagger';
import { NoteType } from '../../work-orders/enums/note-type.enum';

export class PortalNoteDto {
  @ApiProperty({ enum: NoteType, example: NoteType.OBSERVATION })
  type!: NoteType;

  @ApiProperty({ example: 'Se realizó limpieza general del equipo' })
  content!: string;

  @ApiProperty({ example: '2026-01-18T10:00:00.000Z' })
  createdAt!: Date;
}
