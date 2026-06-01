import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
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
} from './events/notification.events';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly notificationsService: NotificationsService,
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
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}
