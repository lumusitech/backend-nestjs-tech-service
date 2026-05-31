import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { NoteType } from '../enums/note-type.enum';
import { WorkOrder } from './work-order.entity';

@Entity('work_order_notes')
export class WorkOrderNote extends BaseEntity {
  @Column({ type: 'enum', enum: NoteType })
  type!: NoteType;

  @Column()
  content!: string;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.notes, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'work_order_id' })
  workOrderId!: string;
}
