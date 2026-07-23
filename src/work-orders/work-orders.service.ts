import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderNote } from './entities/work-order-note.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { WorkOrderStatusLog } from './entities/work-order-status-log.entity';
import { Task } from './entities/task.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { FilterWorkOrderDto } from './dto/filter-work-order.dto';
import { CreateWorkOrderNoteDto } from './dto/create-work-order-note.dto';
import { UpdateWorkOrderNoteDto } from './dto/update-work-order-note.dto';
import { CreateWorkOrderMaterialDto } from './dto/create-work-order-material.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WorkOrderStatus } from '../common/enums/work-order-status.enum';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';
import { User } from '../users/entities/user.entity';
import {
  WorkOrderCreatedEvent,
  WorkOrderStatusChangedEvent,
  WorkOrderTechnicianAssignedEvent,
  WorkOrderTechnicianUnassignedEvent,
  TaskCreatedEvent,
  TaskCompletedEvent,
  WorkOrderNoteAddedEvent,
  WorkOrderNoteUpdatedEvent,
  WorkOrderNoteDeletedEvent,
  WorkOrderMaterialAddedEvent,
} from '../notifications/events/notification.events';

const ALLOWED_SORT_COLUMNS = [
  'createdAt',
  'updatedAt',
  'status',
  'priority',
  'scheduledDate',
  'trackingCode',
] as const;

const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.PENDING]: [
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.POSTPONED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.ASSIGNED]: [
    WorkOrderStatus.ON_THE_WAY,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.POSTPONED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.ON_THE_WAY]: [
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.IN_PROGRESS]: [
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.POSTPONED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.POSTPONED]: [
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.DELIVERED, WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.DELIVERED]: [],
  [WorkOrderStatus.CANCELLED]: [WorkOrderStatus.PENDING],
};

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderNote)
    private readonly noteRepository: Repository<WorkOrderNote>,
    @InjectRepository(WorkOrderMaterial)
    private readonly materialRepository: Repository<WorkOrderMaterial>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkOrderStatusLog)
    private readonly statusLogRepository: Repository<WorkOrderStatusLog>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrder> {
    const { technicianIds, ...orderData } = createWorkOrderDto;

    const trackingCode = await this.generateTrackingCode();

    const workOrder = this.workOrderRepository.create({
      ...orderData,
      trackingCode,
    });

    if (technicianIds && technicianIds.length > 0) {
      workOrder.technicians = await this.userRepository.findBy({
        id: In(technicianIds),
      });
    }

    const saved = await this.workOrderRepository.save(workOrder);

    const withRelations = await this.workOrderRepository.findOne({
      where: { id: saved.id },
      relations: { client: true, serviceType: true, technicians: true },
    });

    if (withRelations) {
      const event = new WorkOrderCreatedEvent();
      event.workOrderId = saved.id;
      event.trackingCode = saved.trackingCode;
      event.clientName = withRelations.client?.name ?? '';
      event.serviceTypeName = withRelations.serviceType?.name ?? '';
      event.priority = saved.priority;
      event.technicianIds = withRelations.technicians?.map((t) => t.id) ?? [];
      this.eventEmitter.emit('workorder.created', event);
    }

    return saved;
  }

  async findAll(
    filterDto: FilterWorkOrderDto,
  ): Promise<PaginatedResponseDto<WorkOrder>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
      search,
      status,
      priority,
      clientId,
      technicianId,
      serviceTypeId,
      dateFrom,
      dateTo,
      sellerId,
    } = filterDto;

    const qb = this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.client', 'client')
      .leftJoinAndSelect('wo.serviceType', 'serviceType')
      .leftJoinAndSelect('wo.technicians', 'technicians')
      .leftJoinAndSelect('wo.seller', 'seller');

    if (search) {
      qb.andWhere(
        `(wo.tracking_code ILIKE :search
          OR unaccent(client.name) ILIKE unaccent(:search)
          OR unaccent(client.email) ILIKE unaccent(:search)
          OR client.phone ILIKE :search
          OR unaccent(serviceType.name) ILIKE unaccent(:search)
          OR unaccent(wo.diagnosis) ILIKE unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('wo.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('wo.priority = :priority', { priority });
    }

    if (clientId) {
      qb.andWhere('wo.client_id = :clientId', { clientId });
    }

    if (technicianId) {
      qb.andWhere('technicians.id = :technicianId', { technicianId });
    }

    if (sellerId) {
      qb.andWhere('wo.seller_id = :sellerId', { sellerId });
    }

    if (serviceTypeId) {
      qb.andWhere('wo.service_type_id = :serviceTypeId', { serviceTypeId });
    }

    if (dateFrom) {
      qb.andWhere('wo.scheduled_date >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('wo.scheduled_date <= :dateTo', { dateTo });
    }

    const safeSortBy = validateSortBy(
      sortBy,
      ALLOWED_SORT_COLUMNS,
      'createdAt',
    );
    qb.orderBy(`wo.${safeSortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: {
        client: true,
        serviceType: true,
        technicians: true,
        seller: true,
        notes: true,
        materials: {
          supplier: true,
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order #${id} not found`);
    }

    return workOrder;
  }

  async validateTechnicianOwnership(
    workOrderId: string,
    technicianId: string,
  ): Promise<void> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId },
      relations: { technicians: true },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order #${workOrderId} not found`);
    }

    const isAssigned = workOrder.technicians.some((t) => t.id === technicianId);

    if (!isAssigned) {
      throw new ForbiddenException('You are not assigned to this work order');
    }
  }

  async update(
    id: string,
    updateWorkOrderDto: UpdateWorkOrderDto,
    userId?: string,
    userRole?: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const oldStatus = workOrder.status;
    const oldTechnicianIds = workOrder.technicians?.map((t) => t.id) ?? [];

    if (
      updateWorkOrderDto.status &&
      updateWorkOrderDto.status !== workOrder.status
    ) {
      this.validateTransition(workOrder.status, updateWorkOrderDto.status);

      if (updateWorkOrderDto.status === WorkOrderStatus.IN_PROGRESS) {
        workOrder.startedAt = new Date();
      }

      if (updateWorkOrderDto.status === WorkOrderStatus.COMPLETED) {
        workOrder.completedAt = new Date();
      }
    }

    const { technicianIds, ...rest } = updateWorkOrderDto;

    Object.assign(workOrder, rest);

    if (technicianIds !== undefined) {
      workOrder.technicians = await this.userRepository.findBy({
        id: In(technicianIds),
      });

      if (
        technicianIds.length > 0 &&
        workOrder.status === WorkOrderStatus.PENDING &&
        !updateWorkOrderDto.status
      ) {
        workOrder.status = WorkOrderStatus.ASSIGNED;
      }
    }

    const saved = await this.workOrderRepository.save(workOrder);

    if (saved.status !== oldStatus && userId && userRole) {
      await this.logStatusTransition(
        saved.id,
        oldStatus,
        saved.status,
        userId,
        userRole,
      );
    }

    if (updateWorkOrderDto.status && updateWorkOrderDto.status !== oldStatus) {
      const event = new WorkOrderStatusChangedEvent();
      event.workOrderId = saved.id;
      event.trackingCode = saved.trackingCode;
      event.oldStatus = oldStatus;
      event.newStatus = saved.status;
      event.technicianIds = oldTechnicianIds;
      this.eventEmitter.emit('workorder.status_changed', event);
    }

    if (technicianIds !== undefined) {
      const assignedEvent = new WorkOrderTechnicianAssignedEvent();
      assignedEvent.workOrderId = saved.id;
      assignedEvent.trackingCode = saved.trackingCode;
      assignedEvent.technicianIds = technicianIds;
      this.eventEmitter.emit('workorder.technician_assigned', assignedEvent);

      const removedIds = oldTechnicianIds.filter((id) => !technicianIds.includes(id));
      if (removedIds.length > 0) {
        const unassignedEvent = new WorkOrderTechnicianUnassignedEvent();
        unassignedEvent.workOrderId = saved.id;
        unassignedEvent.trackingCode = saved.trackingCode;
        unassignedEvent.technicianIds = removedIds;
        this.eventEmitter.emit('workorder.technician_unassigned', unassignedEvent);
      }
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.softRemove(workOrder);
  }

  async hardRemove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.remove(workOrder);
  }

  async replaceTechnicians(
    id: string,
    technicianIds: string[],
    userId?: string,
    userRole?: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    const oldTechnicianIds = workOrder.technicians?.map((t) => t.id) ?? [];
    const oldStatus = workOrder.status;

    workOrder.technicians = await this.userRepository.findBy({
      id: In(technicianIds),
    });

    if (
      technicianIds.length > 0 &&
      workOrder.status === WorkOrderStatus.PENDING
    ) {
      workOrder.status = WorkOrderStatus.ASSIGNED;
    }

    const saved = await this.workOrderRepository.save(workOrder);

    if (saved.status !== oldStatus) {
      if (userId && userRole) {
        await this.logStatusTransition(
          saved.id,
          oldStatus,
          saved.status,
          userId,
          userRole,
        );
      }

      const statusEvent = new WorkOrderStatusChangedEvent();
      statusEvent.workOrderId = saved.id;
      statusEvent.trackingCode = saved.trackingCode;
      statusEvent.oldStatus = oldStatus;
      statusEvent.newStatus = saved.status;
      statusEvent.technicianIds = technicianIds;
      this.eventEmitter.emit('workorder.status_changed', statusEvent);
    }

    const assignedEvent = new WorkOrderTechnicianAssignedEvent();
    assignedEvent.workOrderId = saved.id;
    assignedEvent.trackingCode = saved.trackingCode;
    assignedEvent.technicianIds = technicianIds;
    this.eventEmitter.emit('workorder.technician_assigned', assignedEvent);

    const removedIds = oldTechnicianIds.filter((id) => !technicianIds.includes(id));
    if (removedIds.length > 0) {
      const unassignedEvent = new WorkOrderTechnicianUnassignedEvent();
      unassignedEvent.workOrderId = saved.id;
      unassignedEvent.trackingCode = saved.trackingCode;
      unassignedEvent.technicianIds = removedIds;
      this.eventEmitter.emit('workorder.technician_unassigned', unassignedEvent);
    }

    return saved;
  }

  // ─── Notes ───────────────────────────────────────────

  async createNote(
    workOrderId: string,
    dto: CreateWorkOrderNoteDto,
    createdById: string,
    createdByRole: string,
  ): Promise<WorkOrderNote> {
    const workOrder = await this.findOne(workOrderId);

    const createdByUser = await this.userRepository.findOne({
      where: { id: createdById },
      select: { id: true, name: true },
    });

    const note = this.noteRepository.create({
      ...dto,
      workOrderId,
    });

    const saved = await this.noteRepository.save(note);

    const event = new WorkOrderNoteAddedEvent();
    event.workOrderId = workOrderId;
    event.trackingCode = workOrder.trackingCode;
    event.noteType = dto.type;
    event.contentPreview = dto.content.substring(0, 80);
    event.createdByName = createdByUser?.name ?? 'Usuario';
    event.createdByRole = createdByRole;
    event.technicianIds = workOrder.technicians?.map((t) => t.id) ?? [];
    this.eventEmitter.emit('workorder.note_added', event);

    return saved;
  }

  async findNotes(workOrderId: string): Promise<WorkOrderNote[]> {
    await this.findOne(workOrderId);

    return this.noteRepository.find({
      where: { workOrderId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateNote(
    workOrderId: string,
    noteId: string,
    dto: UpdateWorkOrderNoteDto,
  ): Promise<WorkOrderNote> {
    const workOrder = await this.findOne(workOrderId);

    const note = await this.noteRepository.findOne({
      where: { id: noteId, workOrderId },
    });

    if (!note) {
      throw new NotFoundException(
        `Note #${noteId} not found in work order #${workOrderId}`,
      );
    }

    Object.assign(note, dto);
    const saved = await this.noteRepository.save(note);

    const event = new WorkOrderNoteUpdatedEvent();
    event.workOrderId = workOrderId;
    event.trackingCode = workOrder.trackingCode;
    event.noteId = noteId;
    event.technicianIds = workOrder.technicians?.map((t) => t.id) ?? [];
    this.eventEmitter.emit('workorder.note_updated', event);

    return saved;
  }

  async deleteNote(workOrderId: string, noteId: string): Promise<void> {
    const workOrder = await this.findOne(workOrderId);

    const note = await this.noteRepository.findOne({
      where: { id: noteId, workOrderId },
    });

    if (!note) {
      throw new NotFoundException(
        `Note #${noteId} not found in work order #${workOrderId}`,
      );
    }

    await this.noteRepository.softRemove(note);

    const event = new WorkOrderNoteDeletedEvent();
    event.workOrderId = workOrderId;
    event.trackingCode = workOrder.trackingCode;
    event.noteId = noteId;
    event.technicianIds = workOrder.technicians?.map((t) => t.id) ?? [];
    this.eventEmitter.emit('workorder.note_deleted', event);
  }

  // ─── Materials ───────────────────────────────────────

  async createMaterial(
    workOrderId: string,
    dto: CreateWorkOrderMaterialDto,
  ): Promise<WorkOrderMaterial> {
    const workOrder = await this.findOne(workOrderId);

    const material = this.materialRepository.create({
      ...dto,
      workOrderId,
    });

    const saved = await this.materialRepository.save(material);

    const event = new WorkOrderMaterialAddedEvent();
    event.workOrderId = workOrderId;
    event.trackingCode = workOrder.trackingCode;
    event.materialDescription = dto.description;
    event.quantity = dto.quantity;
    event.technicianIds = workOrder.technicians?.map((t) => t.id) ?? [];
    this.eventEmitter.emit('workorder.material_added', event);

    return saved;
  }

  async findMaterials(workOrderId: string): Promise<WorkOrderMaterial[]> {
    await this.findOne(workOrderId);

    return this.materialRepository.find({
      where: { workOrderId },
      relations: { supplier: true },
      order: { createdAt: 'DESC' },
    });
  }

  async removeMaterial(workOrderId: string, materialId: string): Promise<void> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId, workOrderId },
    });

    if (!material) {
      throw new NotFoundException(
        `Material #${materialId} not found in work order #${workOrderId}`,
      );
    }

    await this.materialRepository.softRemove(material);
  }

  // ─── Tasks ──────────────────────────────────────────

  async createTask(workOrderId: string, dto: CreateTaskDto): Promise<Task> {
    const workOrder = await this.findOne(workOrderId);

    const task = this.taskRepository.create({
      ...dto,
      workOrderId,
    });

    const saved = await this.taskRepository.save(task);

    const event = new TaskCreatedEvent();
    event.taskId = saved.id;
    event.taskTitle = saved.title;
    event.workOrderId = workOrderId;
    event.trackingCode = workOrder.trackingCode;
    event.assignedToId = saved.assignedToId;
    event.technicianIds = workOrder.technicians?.map((t) => t.id) ?? [];
    this.eventEmitter.emit('task.created', event);

    return saved;
  }

  async findTasks(workOrderId: string): Promise<Task[]> {
    await this.findOne(workOrderId);

    return this.taskRepository.find({
      where: { workOrderId },
      relations: { assignedTo: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateTask(
    workOrderId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, workOrderId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task #${taskId} not found in work order #${workOrderId}`,
      );
    }

    const wasCompleted = task.isCompleted;

    if (dto.isCompleted === true && !task.isCompleted) {
      task.completedAt = new Date();
    }

    if (dto.isCompleted === false) {
      task.completedAt = null!;
    }

    Object.assign(task, dto);
    const saved = await this.taskRepository.save(task);

    if (dto.isCompleted === true && !wasCompleted) {
      const workOrder = await this.workOrderRepository.findOne({
        where: { id: workOrderId },
        relations: { technicians: true },
      });

      const event = new TaskCompletedEvent();
      event.taskId = saved.id;
      event.taskTitle = saved.title;
      event.workOrderId = workOrderId;
      event.trackingCode = workOrder?.trackingCode ?? '';
      event.completedByName = '';
      event.technicianIds = workOrder?.technicians?.map((t) => t.id) ?? [];
      this.eventEmitter.emit('task.completed', event);
    }

    return saved;
  }

  async removeTask(workOrderId: string, taskId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, workOrderId },
    });

    if (!task) {
      throw new NotFoundException(
        `Task #${taskId} not found in work order #${workOrderId}`,
      );
    }

    await this.taskRepository.softRemove(task);
  }

  // ─── Private helpers ─────────────────────────────────

  async findStatusLogs(workOrderId: string): Promise<WorkOrderStatusLog[]> {
    return this.statusLogRepository.find({
      where: { workOrderId },
      relations: { changedBy: true },
      order: { timestamp: 'ASC' },
    });
  }

  private async logStatusTransition(
    workOrderId: string,
    fromStatus: WorkOrderStatus | null,
    toStatus: WorkOrderStatus,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const now = new Date();

    const previousLog = await this.statusLogRepository.findOne({
      where: { workOrderId },
      order: { timestamp: 'DESC' },
    });

    const duration = previousLog
      ? Math.floor((now.getTime() - new Date(previousLog.timestamp).getTime()) / 1000)
      : null;

    const log = this.statusLogRepository.create({
      workOrderId,
      fromStatus,
      toStatus,
      changedByUserId: userId,
      changedByRole: userRole,
      timestamp: now,
      duration,
    });

    await this.statusLogRepository.save(log);
  }

  private async generateTrackingCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: WorkOrder | null;

    do {
      let suffix = '';
      for (let i = 0; i < 5; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `TS-${suffix}`;

      exists = await this.workOrderRepository.findOne({
        where: { trackingCode: code },
        withDeleted: true,
      });
    } while (exists);

    return code;
  }

  private validateTransition(
    current: WorkOrderStatus,
    next: WorkOrderStatus,
  ): void {
    const allowed = VALID_TRANSITIONS[current];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} → ${next}`,
      );
    }
  }
}
