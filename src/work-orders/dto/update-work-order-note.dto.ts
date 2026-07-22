import { PartialType } from '@nestjs/swagger';
import { CreateWorkOrderNoteDto } from './create-work-order-note.dto';

export class UpdateWorkOrderNoteDto extends PartialType(CreateWorkOrderNoteDto) {}
