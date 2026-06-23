import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PendingItem } from './entities/pending-item.entity';
import { CreatePendingItemDto } from './dto/create-pending-item.dto';
import { UpdatePendingItemDto } from './dto/update-pending-item.dto';
import { FilterPendingItemDto } from './dto/filter-pending-item.dto';
import { PendingItemStatus } from './enums/pending-item-status.enum';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import {
  PendingItemCreatedEvent,
  PendingItemDueTodayEvent,
  PendingItemOverdueEvent,
} from '../notifications/events/notification.events';

@Injectable()
export class PendingItemsService {
  constructor(
    @InjectRepository(PendingItem)
    private readonly pendingItemRepository: Repository<PendingItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createDto: CreatePendingItemDto,
    createdById: string,
    userRole: UserRole,
  ): Promise<PendingItem> {
    if (
      userRole === UserRole.TECHNICIAN &&
      createDto.referenceType !== 'work_order'
    ) {
      throw new BadRequestException(
        'Technicians can only create pending items for work orders',
      );
    }

    if (userRole === UserRole.TECHNICIAN && !createDto.assignedToId) {
      createDto.assignedToId = createdById;
    }

    const item = this.pendingItemRepository.create({
      ...createDto,
      dueDate: new Date(createDto.dueDate),
      createdById,
    });

    const saved = await this.pendingItemRepository.save(item);

    const event = new PendingItemCreatedEvent();
    event.pendingItemId = saved.id;
    event.title = saved.title;
    event.dueDate = saved.dueDate.toISOString();
    event.priority = saved.priority;
    event.assignedToId = saved.assignedToId;
    event.createdById = createdById;
    this.eventEmitter.emit('pending_item.created', event);

    return saved;
  }

  async findAll(
    filterDto: FilterPendingItemDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<PaginatedResponseDto<PendingItem>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'dueDate',
      order = 'ASC',
      status,
      priority,
      type,
      assignedToId,
      dueDateFrom,
      dueDateTo,
    } = filterDto;

    const qb = this.pendingItemRepository
      .createQueryBuilder('pi')
      .leftJoinAndSelect('pi.assignedTo', 'assignedTo')
      .leftJoinAndSelect('pi.createdBy', 'createdBy');

    if (userRole === UserRole.TECHNICIAN && userId) {
      qb.andWhere('pi.assigned_to_id = :userId', { userId });
    }

    if (status) {
      qb.andWhere('pi.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('pi.priority = :priority', { priority });
    }

    if (type) {
      qb.andWhere('pi.type = :type', { type });
    }

    if (assignedToId) {
      qb.andWhere('pi.assigned_to_id = :assignedToId', { assignedToId });
    }

    if (dueDateFrom) {
      qb.andWhere('pi.due_date >= :dueDateFrom', { dueDateFrom });
    }

    if (dueDateTo) {
      qb.andWhere('pi.due_date <= :dueDateTo', { dueDateTo });
    }

    qb.orderBy(`pi.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<PendingItem> {
    const item = await this.pendingItemRepository.findOne({
      where: { id },
      relations: { assignedTo: true, createdBy: true },
    });

    if (!item) {
      throw new NotFoundException(`Pending item #${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    updateDto: UpdatePendingItemDto,
  ): Promise<PendingItem> {
    const item = await this.findOne(id);

    if (
      updateDto.status === PendingItemStatus.COMPLETED &&
      item.status !== PendingItemStatus.COMPLETED
    ) {
      item.completedAt = new Date();
    }

    if (
      updateDto.status === PendingItemStatus.COMPLETED &&
      item.status === PendingItemStatus.COMPLETED
    ) {
      // Already completed, no-op
    }

    if (
      updateDto.status &&
      updateDto.status !== PendingItemStatus.COMPLETED &&
      item.status === PendingItemStatus.COMPLETED
    ) {
      item.completedAt = null!;
    }

    Object.assign(item, updateDto);

    if (updateDto.dueDate) {
      item.dueDate = new Date(updateDto.dueDate);
    }
    if (updateDto.completedAt) {
      item.completedAt = new Date(updateDto.completedAt);
    }

    return this.pendingItemRepository.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.pendingItemRepository.softRemove(item);
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDueDateNotifications(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingItems = await this.pendingItemRepository.find({
      where: {
        status: PendingItemStatus.PENDING,
        dueDate: LessThanOrEqual(tomorrow),
      },
      relations: { assignedTo: true },
    });

    for (const item of pendingItems) {
      if (!item.assignedToId) continue;

      const isOverdue = item.dueDate < today;

      if (isOverdue) {
        const event = new PendingItemOverdueEvent();
        event.pendingItemId = item.id;
        event.title = item.title;
        event.dueDate = item.dueDate.toISOString();
        event.assignedToId = item.assignedToId;
        this.eventEmitter.emit('pending_item.overdue', event);
      } else {
        const event = new PendingItemDueTodayEvent();
        event.pendingItemId = item.id;
        event.title = item.title;
        event.dueDate = item.dueDate.toISOString();
        event.assignedToId = item.assignedToId;
        this.eventEmitter.emit('pending_item.due_today', event);
      }
    }
  }
}
