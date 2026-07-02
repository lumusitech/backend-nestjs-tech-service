import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { NotificationType } from './enums/notification-type.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import {
  WorkOrderCreatedEvent,
  WorkOrderStatusChangedEvent,
  WorkOrderTechnicianAssignedEvent,
  TaskCreatedEvent,
  TaskCompletedEvent,
  PaymentCreatedEvent,
  PaymentStatusChangedEvent,
  PendingItemCreatedEvent,
  PendingItemDueTodayEvent,
  PendingItemOverdueEvent,
  InquiryCreatedEvent,
  InquiryAssignedEvent,
  InquiryContactedEvent,
  InquiryReviewedEvent,
} from './events/notification.events';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent('workorder.created')
  async handleWorkOrderCreated(event: WorkOrderCreatedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = [...new Set([...adminIds, ...event.technicianIds])];

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.WORK_ORDER_CREATED,
      title: 'Nueva orden de trabajo',
      message: `Se creó la orden ${event.trackingCode} para ${event.clientName} — ${event.serviceTypeName}`,
      userId,
      referenceId: event.workOrderId,
      referenceType: 'work_order',
      metadata: {
        trackingCode: event.trackingCode,
        priority: event.priority,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(recipientIds, 'Nueva orden de trabajo', `Se creó la orden ${event.trackingCode}`);
  }

  @OnEvent('workorder.status_changed')
  async handleWorkOrderStatusChanged(
    event: WorkOrderStatusChangedEvent,
  ): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = [...new Set([...adminIds, ...event.technicianIds])];

    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignada',
      in_progress: 'En progreso',
      postponed: 'Pospuesta',
      completed: 'Completada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
    };

    const oldLabel = statusLabels[event.oldStatus] || event.oldStatus;
    const newLabel = statusLabels[event.newStatus] || event.newStatus;

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.WORK_ORDER_STATUS_CHANGED,
      title: `Orden ${event.trackingCode} actualizada`,
      message: `Estado cambiado de '${oldLabel}' a '${newLabel}'`,
      userId,
      referenceId: event.workOrderId,
      referenceType: 'work_order',
      metadata: {
        trackingCode: event.trackingCode,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(recipientIds, `Orden ${event.trackingCode} actualizada`, `Estado: '${oldLabel}' → '${newLabel}'`);
  }

  @OnEvent('workorder.technician_assigned')
  async handleWorkOrderTechnicianAssigned(
    event: WorkOrderTechnicianAssignedEvent,
  ): Promise<void> {
    const dtos: CreateNotificationDto[] = event.technicianIds.map((userId) => ({
      type: NotificationType.WORK_ORDER_TECHNICIAN_ASSIGNED,
      title: 'Nueva asignación',
      message: `Fuiste asignado a la orden ${event.trackingCode}`,
      userId,
      referenceId: event.workOrderId,
      referenceType: 'work_order',
      metadata: { trackingCode: event.trackingCode },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(event.technicianIds, 'Nueva asignación', `Fuiste asignado a la orden ${event.trackingCode}`);
  }

  @OnEvent('task.created')
  async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = [...new Set([...adminIds, ...event.technicianIds])];

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.TASK_CREATED,
      title: 'Nueva tarea',
      message: `Tarea '${event.taskTitle}' creada en orden ${event.trackingCode}`,
      userId,
      referenceId: event.taskId,
      referenceType: 'task',
      metadata: {
        taskTitle: event.taskTitle,
        trackingCode: event.trackingCode,
        workOrderId: event.workOrderId,
      },
    }));

    await this.notificationsService.createBulk(dtos);
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = [...new Set([...adminIds, ...event.technicianIds])];

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.TASK_COMPLETED,
      title: 'Tarea completada',
      message: `${event.completedByName} completó '${event.taskTitle}' en orden ${event.trackingCode}`,
      userId,
      referenceId: event.taskId,
      referenceType: 'task',
      metadata: {
        taskTitle: event.taskTitle,
        trackingCode: event.trackingCode,
        workOrderId: event.workOrderId,
        completedByName: event.completedByName,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(recipientIds, 'Tarea completada', `${event.completedByName} completó '${event.taskTitle}'`);
  }

  @OnEvent('payment.created')
  async handlePaymentCreated(event: PaymentCreatedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();

    const dtos: CreateNotificationDto[] = adminIds.map((userId) => ({
      type: NotificationType.PAYMENT_CREATED,
      title: 'Nuevo pago registrado',
      message: `Pago de $${event.amount} ARS por ${event.method} para ${event.trackingCode}`,
      userId,
      referenceId: event.paymentId,
      referenceType: 'payment',
      metadata: {
        amount: event.amount,
        method: event.method,
        trackingCode: event.trackingCode,
        workOrderId: event.workOrderId,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(adminIds, 'Nuevo pago registrado', `Pago de ${event.amount} ARS`);
  }

  @OnEvent('payment.status_changed')
  async handlePaymentStatusChanged(
    event: PaymentStatusChangedEvent,
  ): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = [...new Set([...adminIds, ...event.technicianIds])];

    let notificationType: NotificationType;
    let title: string;
    let message: string;

    if (event.newStatus === 'approved') {
      notificationType = NotificationType.PAYMENT_APPROVED;
      title = 'Pago aprobado';
      message = `Pago de $${event.amount} ARS aprobado para ${event.trackingCode}`;
    } else if (event.newStatus === 'rejected') {
      notificationType = NotificationType.PAYMENT_REJECTED;
      title = 'Pago rechazado';
      message = `El pago de $${event.amount} ARS fue rechazado para ${event.trackingCode}`;
    } else {
      return;
    }

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: notificationType,
      title,
      message,
      userId,
      referenceId: event.paymentId,
      referenceType: 'payment',
      metadata: {
        amount: event.amount,
        newStatus: event.newStatus,
        trackingCode: event.trackingCode,
        workOrderId: event.workOrderId,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(recipientIds, title, message);
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }

  @OnEvent('pending_item.created')
  async handlePendingItemCreated(
    event: PendingItemCreatedEvent,
  ): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = event.assignedToId
      ? [...new Set([...adminIds, event.assignedToId])]
      : adminIds;

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.PENDING_ITEM_CREATED,
      title: 'Nuevo trabajo pendiente',
      message: `Se creó el pendiente '${event.title}' con vencimiento ${event.dueDate}`,
      userId,
      referenceId: event.pendingItemId,
      referenceType: 'pending_item',
      metadata: {
        title: event.title,
        dueDate: event.dueDate,
        priority: event.priority,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(recipientIds, 'Nuevo trabajo pendiente', `'${event.title}' con vencimiento ${event.dueDate}`);
  }

  @OnEvent('pending_item.due_today')
  async handlePendingItemDueToday(
    event: PendingItemDueTodayEvent,
  ): Promise<void> {
    const dtos: CreateNotificationDto[] = [
      {
        type: NotificationType.PENDING_ITEM_DUE_TODAY,
        title: 'Pendiente vence hoy',
        message: `'${event.title}' vence hoy`,
        userId: event.assignedToId,
        referenceId: event.pendingItemId,
        referenceType: 'pending_item',
        metadata: {
          title: event.title,
          dueDate: event.dueDate,
        },
      },
    ];

    await this.notificationsService.createBulk(dtos);
  }

  @OnEvent('pending_item.overdue')
  async handlePendingItemOverdue(
    event: PendingItemOverdueEvent,
  ): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = [...new Set([...adminIds, event.assignedToId])];

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.PENDING_ITEM_OVERDUE,
      title: 'Pendiente vencido',
      message: `'${event.title}' está vencido desde ${event.dueDate}`,
      userId,
      referenceId: event.pendingItemId,
      referenceType: 'pending_item',
      metadata: {
        title: event.title,
        dueDate: event.dueDate,
      },
    }));

    await this.notificationsService.createBulk(dtos);
  }

  @OnEvent('inquiry.created')
  async handleInquiryCreated(event: InquiryCreatedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();
    const recipientIds = event.assignedToId
      ? [...new Set([...adminIds, event.assignedToId])]
      : adminIds;

    const dtos: CreateNotificationDto[] = recipientIds.map((userId) => ({
      type: NotificationType.INQUIRY_CREATED,
      title: 'Nueva consulta recibida',
      message: `${event.clientName}: ${event.description.substring(0, 100)}`,
      userId,
      referenceId: event.inquiryId,
      referenceType: 'inquiry',
      metadata: {
        clientName: event.clientName,
        source: event.source,
      },
    }));

    await this.notificationsService.createBulk(dtos);
  }

  @OnEvent('inquiry.assigned')
  async handleInquiryAssigned(event: InquiryAssignedEvent): Promise<void> {
    const dtos: CreateNotificationDto[] = [
      {
        type: NotificationType.INQUIRY_ASSIGNED,
        title: 'Consulta asignada',
        message: `Se te asignó la consulta de ${event.clientName}`,
        userId: event.assignedToId,
        referenceId: event.inquiryId,
        referenceType: 'inquiry',
        metadata: { clientName: event.clientName },
      },
    ];

    await this.notificationsService.createBulk(dtos);
    this.sendPush([event.assignedToId], 'Consulta asignada', `Se te asignó la consulta de ${event.clientName}`);
  }

  @OnEvent('inquiry.contacted')
  async handleInquiryContacted(event: InquiryContactedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();

    const dtos: CreateNotificationDto[] = adminIds.map((userId) => ({
      type: NotificationType.INQUIRY_CONTACTED,
      title: 'Consulta contactada',
      message: `Se contactó a ${event.clientName} — ${event.technicianNotes.substring(0, 80)}`,
      userId,
      referenceId: event.inquiryId,
      referenceType: 'inquiry',
      metadata: {
        clientName: event.clientName,
        technicianNotes: event.technicianNotes,
      },
    }));

    await this.notificationsService.createBulk(dtos);
  }

  @OnEvent('inquiry.reviewed')
  async handleInquiryReviewed(event: InquiryReviewedEvent): Promise<void> {
    const adminIds = await this.getAdminIds();

    const decisionLabel =
      event.adminDecision === 'approved' ? 'aprobada' : 'rechazada';

    const dtos: CreateNotificationDto[] = adminIds.map((userId) => ({
      type: NotificationType.INQUIRY_REVIEWED,
      title: `Consulta ${decisionLabel}`,
      message: `La consulta de ${event.clientName} fue ${decisionLabel}`,
      userId,
      referenceId: event.inquiryId,
      referenceType: 'inquiry',
      metadata: {
        clientName: event.clientName,
        adminDecision: event.adminDecision,
      },
    }));

    await this.notificationsService.createBulk(dtos);
    this.sendPush(adminIds, `Consulta ${decisionLabel}`, `La consulta de ${event.clientName} fue ${decisionLabel}`);
  }

  private async sendPush(
    userIds: string[],
    title: string,
    body: string,
  ): Promise<void> {
    try {
      await this.pushNotificationsService.sendToAll(userIds, { title, body });
    } catch (error) {
      this.logger.warn(`Push notification failed: ${error}`);
    }
  }
}
