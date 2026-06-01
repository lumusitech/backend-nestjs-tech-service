import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { NoteType } from '../work-orders/enums/note-type.enum';
import { PortalResponseDto } from './dto/portal-response.dto';
import { PortalTaskDto } from './dto/portal-task.dto';
import { PortalNoteDto } from './dto/portal-note.dto';

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async trackByCode(trackingCode: string): Promise<PortalResponseDto> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { trackingCode },
      relations: {
        client: true,
        serviceType: true,
        tasks: true,
        notes: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException(
        `Work order with tracking code '${trackingCode}' not found`,
      );
    }

    const publicNotes = this.buildPublicNotes(workOrder.notes);
    const tasks = this.buildTasks(workOrder.tasks);
    const paymentSummary = await this.buildPaymentSummary(workOrder.id);

    return {
      trackingCode: workOrder.trackingCode,
      status: workOrder.status,
      priority: workOrder.priority,
      location: workOrder.location,
      diagnosis: workOrder.diagnosis,
      scheduledDate: workOrder.scheduledDate,
      startedAt: workOrder.startedAt,
      completedAt: workOrder.completedAt,
      warrantyUntil: workOrder.warrantyUntil,
      createdAt: workOrder.createdAt,
      serviceType: {
        name: workOrder.serviceType.name,
        description: workOrder.serviceType.description,
      },
      clientName: workOrder.client.name,
      tasks,
      publicNotes,
      paymentSummary,
    };
  }

  private buildPublicNotes(notes: WorkOrder['notes']): PortalNoteDto[] {
    return notes
      .filter((note) => note.type !== NoteType.INTERNAL)
      .map((note) => ({
        type: note.type,
        content: note.content,
        createdAt: note.createdAt,
      }));
  }

  private buildTasks(tasks: WorkOrder['tasks']): PortalTaskDto[] {
    return tasks.map((task) => ({
      title: task.title,
      description: task.description,
      isCompleted: task.isCompleted,
      completedAt: task.completedAt,
    }));
  }

  private async buildPaymentSummary(workOrderId: string): Promise<{
    totalApproved: number;
    paymentCount: number;
    hasPayments: boolean;
    isFullyPaid: boolean;
    installmentsPending: number;
    installmentsTotal: number;
  }> {
    const approvedPayments = await this.paymentRepository.find({
      where: {
        workOrderId,
        status: PaymentStatus.APPROVED,
      },
    });

    const totalApproved = approvedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const paymentCount = approvedPayments.length;
    const hasPayments = paymentCount > 0;

    let installmentsTotal = 0;
    let installmentsApproved = 0;

    for (const payment of approvedPayments) {
      if (payment.totalInstallments > 1) {
        installmentsTotal = Math.max(
          installmentsTotal,
          payment.totalInstallments,
        );
        installmentsApproved = Math.max(
          installmentsApproved,
          payment.installmentNumber,
        );
      }
    }

    const installmentsPending = Math.max(
      0,
      installmentsTotal - installmentsApproved,
    );

    return {
      totalApproved,
      paymentCount,
      hasPayments,
      isFullyPaid: hasPayments,
      installmentsPending,
      installmentsTotal,
    };
  }
}
