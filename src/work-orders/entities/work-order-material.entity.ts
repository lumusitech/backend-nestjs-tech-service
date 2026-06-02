import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { WorkOrder } from './work-order.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('work_order_materials')
export class WorkOrderMaterial extends BaseEntity {
  @ApiProperty({ example: 'Cable UTP Cat6 - 50m' })
  @Column()
  description!: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @ApiProperty({ example: 1500.5 })
  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2 })
  unitCost!: number;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.materials, {
    nullable: false,
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @ApiProperty({ example: 'e5f6a7b8-c9d0-1234-efab-345678901234' })
  @Column({ name: 'work_order_id' })
  workOrderId!: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  @Column({ name: 'supplier_id', nullable: true })
  supplierId!: string;
}
