import { NoteType } from '../../work-orders/enums/note-type.enum';

export class PortalNoteDto {
  type!: NoteType;
  content!: string;
  createdAt!: Date;
}
