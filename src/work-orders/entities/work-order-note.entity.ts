import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { NoteType } from '../enums/note-type.enum';
import { WorkOrder } from './work-order.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('work_order_notes')
export class WorkOrderNote extends BaseEntity {
  @ApiProperty({ enum: NoteType, example: NoteType.OBSERVATION })
  @Column({ type: 'enum', enum: NoteType })
  type!: NoteType;

  @ApiProperty({ example: 'Se realizó diagnóstico inicial del equipo' })
  @Column()
  content!: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.notes, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @ApiProperty({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  @Column({ name: 'work_order_id' })
  workOrderId!: string;
}
