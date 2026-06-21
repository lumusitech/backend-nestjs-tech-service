import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { InquirySource } from '../enums/inquiry-source.enum';
import { InquiryStatus } from '../enums/inquiry-status.enum';
import { InquiryRecommendation } from '../enums/inquiry-recommendation.enum';
import { InquiryDecision } from '../enums/inquiry-decision.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('inquiries')
export class Inquiry extends BaseEntity {
  @ApiProperty({ example: 'Juan Pérez' })
  @Column({ name: 'client_name' })
  clientName!: string;

  @ApiPropertyOptional({ example: '+54 11 1234-5678' })
  @Column({ name: 'client_phone', nullable: true })
  clientPhone!: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @Column({ name: 'client_email', nullable: true })
  clientEmail!: string;

  @ApiPropertyOptional({ example: 'Av. Corrientes 1234, CABA' })
  @Column({ name: 'client_address', nullable: true })
  clientAddress!: string;

  @ApiProperty({ example: 'La notebook no prende, hace ruido raro el ventilador' })
  @Column({ type: 'text' })
  description!: string;

  @ApiProperty({ enum: InquirySource, example: InquirySource.PHONE })
  @Column({ type: 'enum', enum: InquirySource })
  source!: InquirySource;

  @ApiProperty({ enum: InquiryStatus, example: InquiryStatus.NEW })
  @Column({
    type: 'enum',
    enum: InquiryStatus,
    default: InquiryStatus.NEW,
  })
  status!: InquiryStatus;

  @ApiPropertyOptional({ example: 'medium' })
  @Column({ nullable: true })
  priority!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo!: User;

  @ApiPropertyOptional()
  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @ApiProperty()
  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ApiPropertyOptional({ example: 'El ventilador está sucio, necesita limpieza general' })
  @Column({ name: 'technician_notes', type: 'text', nullable: true })
  technicianNotes!: string;

  @ApiPropertyOptional({ example: 15000 })
  @Column({ name: 'estimated_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost!: number;

  @ApiPropertyOptional({ example: 2 })
  @Column({ name: 'estimated_duration', nullable: true })
  estimatedDuration!: number;

  @ApiPropertyOptional({ example: 'Pasta térmica, limpieza de ventiladores' })
  @Column({ name: 'materials_needed', type: 'text', nullable: true })
  materialsNeeded!: string;

  @ApiPropertyOptional({ enum: InquiryRecommendation })
  @Column({ type: 'enum', enum: InquiryRecommendation, nullable: true })
  recommendation!: InquiryRecommendation;

  @ApiPropertyOptional({ enum: InquiryDecision })
  @Column({
    type: 'enum',
    enum: InquiryDecision,
    default: InquiryDecision.PENDING,
  })
  adminDecision!: InquiryDecision;

  @ApiPropertyOptional()
  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes!: string;

  @ManyToOne(() => WorkOrder, { nullable: true })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @ApiPropertyOptional()
  @Column({ name: 'work_order_id', nullable: true })
  workOrderId!: string;

  @ApiPropertyOptional()
  @Column({ name: 'contacted_at', type: 'timestamp', nullable: true })
  contactedAt!: Date;

  @ApiPropertyOptional()
  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt!: Date;
}
