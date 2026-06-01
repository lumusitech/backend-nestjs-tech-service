import { WorkOrderStatus } from '../../common/enums/work-order-status.enum';
import { Priority } from '../../common/enums/priority.enum';
import { WorkOrderLocation } from '../../work-orders/enums/work-order-location.enum';
import { PortalTaskDto } from './portal-task.dto';
import { PortalNoteDto } from './portal-note.dto';

export class PortalPaymentSummaryDto {
  totalApproved!: number;
  paymentCount!: number;
  hasPayments!: boolean;
  isFullyPaid!: boolean;
  installmentsPending!: number;
  installmentsTotal!: number;
}

export class PortalServiceTypeDto {
  name!: string;
  description!: string;
}

export class PortalResponseDto {
  trackingCode!: string;
  status!: WorkOrderStatus;
  priority!: Priority;
  location!: WorkOrderLocation;
  diagnosis!: string | null;
  scheduledDate!: Date | null;
  startedAt!: Date | null;
  completedAt!: Date | null;
  warrantyUntil!: Date | null;
  createdAt!: Date;
  serviceType!: PortalServiceTypeDto;
  clientName!: string;
  tasks!: PortalTaskDto[];
  publicNotes!: PortalNoteDto[];
  paymentSummary!: PortalPaymentSummaryDto;
}
