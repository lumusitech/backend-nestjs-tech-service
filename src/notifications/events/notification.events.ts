export class WorkOrderCreatedEvent {
  workOrderId!: string;
  trackingCode!: string;
  clientName!: string;
  serviceTypeName!: string;
  priority!: string;
  technicianIds!: string[];
}

export class WorkOrderStatusChangedEvent {
  workOrderId!: string;
  trackingCode!: string;
  oldStatus!: string;
  newStatus!: string;
  technicianIds!: string[];
}

export class WorkOrderTechnicianAssignedEvent {
  workOrderId!: string;
  trackingCode!: string;
  technicianIds!: string[];
}

export class TaskCreatedEvent {
  taskId!: string;
  taskTitle!: string;
  workOrderId!: string;
  trackingCode!: string;
  assignedToId?: string;
  technicianIds!: string[];
}

export class TaskCompletedEvent {
  taskId!: string;
  taskTitle!: string;
  workOrderId!: string;
  trackingCode!: string;
  completedByName!: string;
  technicianIds!: string[];
}

export class PaymentCreatedEvent {
  paymentId!: string;
  amount!: number;
  method!: string;
  workOrderId!: string;
  trackingCode!: string;
}

export class PaymentStatusChangedEvent {
  paymentId!: string;
  amount!: number;
  newStatus!: string;
  workOrderId!: string;
  trackingCode!: string;
  technicianIds!: string[];
}

export class PendingItemCreatedEvent {
  pendingItemId!: string;
  title!: string;
  dueDate!: string;
  priority!: string;
  assignedToId?: string;
  createdById!: string;
}

export class PendingItemDueTodayEvent {
  pendingItemId!: string;
  title!: string;
  dueDate!: string;
  assignedToId!: string;
}

export class PendingItemOverdueEvent {
  pendingItemId!: string;
  title!: string;
  dueDate!: string;
  assignedToId!: string;
}

export class InquiryCreatedEvent {
  inquiryId!: string;
  clientName!: string;
  description!: string;
  source!: string;
  assignedToId?: string;
  createdById!: string;
}

export class InquiryAssignedEvent {
  inquiryId!: string;
  clientName!: string;
  assignedToId!: string;
  assignedByName!: string;
}

export class InquiryContactedEvent {
  inquiryId!: string;
  clientName!: string;
  technicianNotes!: string;
  assignedToId?: string;
}

export class InquiryReviewedEvent {
  inquiryId!: string;
  clientName!: string;
  adminDecision!: string;
  adminNotes?: string;
}
