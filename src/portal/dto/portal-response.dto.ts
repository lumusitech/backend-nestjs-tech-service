import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { Priority } from '../../common/enums/priority.enum';
import { WorkOrderLocation } from '../../work-orders/enums/work-order-location.enum';
import { PortalTaskDto } from './portal-task.dto';
import { PortalNoteDto } from './portal-note.dto';

export class PortalPaymentSummaryDto {
  @ApiProperty({ example: 12500 })
  totalApproved!: number;

  @ApiProperty({ example: 2 })
  paymentCount!: number;

  @ApiProperty({ example: true })
  hasPayments!: boolean;

  @ApiProperty({ example: true })
  isFullyPaid!: boolean;

  @ApiProperty({ example: 0 })
  installmentsPending!: number;

  @ApiProperty({ example: 1 })
  installmentsTotal!: number;
}

export class PortalServiceTypeDto {
  @ApiProperty({ example: 'Reparación de PC' })
  name!: string;

  @ApiProperty({
    example:
      'Diagnóstico y reparación de computadoras de escritorio y portátiles',
  })
  description!: string;
}

export class PortalResponseDto {
  @ApiProperty({ example: 'TS-A1B2C3' })
  trackingCode!: string;

  @ApiProperty({ enum: WorkOrderStatus, example: WorkOrderStatus.IN_PROGRESS })
  status!: WorkOrderStatus;

  @ApiProperty({ enum: Priority, example: Priority.HIGH })
  priority!: Priority;

  @ApiProperty({ enum: WorkOrderLocation, example: WorkOrderLocation.WORKSHOP })
  location!: WorkOrderLocation;

  @ApiPropertyOptional({ example: 'Fuente de poder dañada por sobrevoltaje' })
  diagnosis!: string | null;

  @ApiPropertyOptional({ example: '2026-01-18T10:00:00.000Z' })
  scheduledDate!: Date | null;

  @ApiPropertyOptional({ example: '2026-01-18T14:00:00.000Z' })
  startedAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-01-20T16:00:00.000Z' })
  completedAt!: Date | null;

  @ApiPropertyOptional({ example: '2026-04-20T16:00:00.000Z' })
  warrantyUntil!: Date | null;

  @ApiProperty({ example: '2026-01-15T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: PortalServiceTypeDto })
  serviceType!: PortalServiceTypeDto;

  @ApiProperty({ example: 'Juan Pérez' })
  clientName!: string;

  @ApiProperty({ type: [PortalTaskDto] })
  tasks!: PortalTaskDto[];

  @ApiProperty({ type: [PortalNoteDto] })
  publicNotes!: PortalNoteDto[];

  @ApiProperty({ type: PortalPaymentSummaryDto })
  paymentSummary!: PortalPaymentSummaryDto;
}
