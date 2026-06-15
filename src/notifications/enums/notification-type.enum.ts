export enum NotificationType {
  WORK_ORDER_CREATED = 'work_order.created',
  WORK_ORDER_STATUS_CHANGED = 'work_order.status_changed',
  WORK_ORDER_TECHNICIAN_ASSIGNED = 'work_order.technician_assigned',
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_APPROVED = 'payment.approved',
  PAYMENT_REJECTED = 'payment.rejected',
  PENDING_ITEM_CREATED = 'pending_item.created',
  PENDING_ITEM_DUE_TODAY = 'pending_item.due_today',
  PENDING_ITEM_OVERDUE = 'pending_item.overdue',
}
