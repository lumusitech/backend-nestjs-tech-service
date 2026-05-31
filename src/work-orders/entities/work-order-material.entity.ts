import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WorkOrder } from './work-order.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

@Entity('work_order_materials')
export class WorkOrderMaterial extends BaseEntity {
  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2 })
  unitCost!: number;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.materials, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId!: string;
}
