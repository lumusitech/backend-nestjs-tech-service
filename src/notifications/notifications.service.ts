import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'type', 'isRead'] as const;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    const saved = await this.notificationRepository.save(notification);

    this.gateway.emitToUser(dto.userId, 'notification', {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      metadata: saved.metadata,
      referenceId: saved.referenceId,
      referenceType: saved.referenceType,
      isRead: saved.isRead,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  async createBulk(dtos: CreateNotificationDto[]): Promise<Notification[]> {
    if (dtos.length === 0) return [];

    const notifications = this.notificationRepository.create(dtos);
    const saved = await this.notificationRepository.save(notifications);

    for (let i = 0; i < saved.length; i++) {
      this.gateway.emitToUser(dtos[i].userId, 'notification', {
        id: saved[i].id,
        type: saved[i].type,
        title: saved[i].title,
        message: saved[i].message,
        metadata: saved[i].metadata,
        referenceId: saved[i].referenceId,
        referenceType: saved[i].referenceType,
        isRead: saved[i].isRead,
        createdAt: saved[i].createdAt,
      });
    }

    return saved;
  }

  async findAll(
    userId: string,
    filterDto: FilterNotificationDto,
  ): Promise<PaginatedResponseDto<Notification>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      type,
      isRead,
      search,
    } = filterDto;

    const qb = this.notificationRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId });

    if (search) {
      qb.andWhere(
        `(unaccent(n.title) ILIKE unaccent(:search)
          OR unaccent(n.message) ILIKE unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    if (type) {
      qb.andWhere('n.type = :type', { type });
    }

    if (isRead !== undefined) {
      qb.andWhere('n.is_read = :isRead', { isRead });
    }

    const safeSortBy = validateSortBy(
      sortBy,
      ALLOWED_SORT_COLUMNS,
      'createdAt',
    );
    qb.orderBy(`n.${safeSortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return notification!;
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
