import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './gateways/notifications.gateway';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../common/testing/mock-query-builder.helper';
import { NotificationType } from './enums/notification-type.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: ReturnType<typeof createMockRepository>;
  let gateway: { emitToUser: jest.Mock };

  const mockNotification = {
    id: 'n-1',
    userId: 'u-1',
    type: NotificationType.WORK_ORDER_CREATED,
    title: 'Nueva orden',
    message: 'Se creó una orden',
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Notification;

  beforeEach(async () => {
    repo = createMockRepository();
    gateway = { emitToUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repo },
        { provide: NotificationsGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification and emit via gateway', async () => {
      const dto: CreateNotificationDto = {
        userId: 'u-1',
        type: NotificationType.WORK_ORDER_CREATED,
        title: 'Título',
        message: 'Mensaje',
      };
      repo.create.mockReturnValue(mockNotification);
      repo.save.mockResolvedValue(mockNotification);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(mockNotification);
      expect(gateway.emitToUser).toHaveBeenCalledWith(
        'u-1',
        'notification',
        expect.objectContaining({ id: 'n-1', title: 'Nueva orden' }),
      );
      expect(result).toEqual(mockNotification);
    });
  });

  describe('createBulk', () => {
    it('should return empty array when no dtos', async () => {
      const result = await service.createBulk([]);
      expect(result).toEqual([]);
    });

    it('should create multiple and emit for each', async () => {
      const dto1: CreateNotificationDto = {
        userId: 'u-1',
        type: NotificationType.WORK_ORDER_CREATED,
        title: 'A',
        message: 'a',
      };
      const dto2: CreateNotificationDto = {
        userId: 'u-2',
        type: NotificationType.TASK_CREATED,
        title: 'B',
        message: 'b',
      };
      const n1 = { ...mockNotification, id: 'n-1', userId: 'u-1' };
      const n2 = { ...mockNotification, id: 'n-2', userId: 'u-2' };

      repo.create.mockReturnValue([n1, n2]);
      repo.save.mockResolvedValue([n1, n2]);

      const result = await service.createBulk([dto1, dto2]);

      expect(repo.create).toHaveBeenCalledWith([dto1, dto2]);
      expect(gateway.emitToUser).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications scoped to user', async () => {
      const qb = createMockQueryBuilder([mockNotification], 1);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('u-1', { page: 1, limit: 10 });

      expect(qb.where).toHaveBeenCalledWith('n.user_id = :userId', {
        userId: 'u-1',
      });
      expect(result.data).toEqual([mockNotification]);
      expect(result.total).toBe(1);
    });

    it('should apply isRead filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('u-1', { isRead: false });

      expect(qb.andWhere).toHaveBeenCalledWith('n.is_read = :isRead', {
        isRead: false,
      });
    });

    it('should apply type and search filters', async () => {
      const qb = createMockQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('u-1', {
        type: NotificationType.WORK_ORDER_CREATED,
        search: 'orden',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('n.type = :type', {
        type: NotificationType.WORK_ORDER_CREATED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        {
          search: '%orden%',
        },
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const unread = { ...mockNotification, isRead: false };
      repo.findOne.mockResolvedValue(unread);
      repo.save.mockImplementation((n: Notification) => Promise.resolve(n));

      const result = await service.markAsRead('n-1', 'u-1');

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);
      expect(repo.save).toHaveBeenCalled();
    });

    it('should not save if already read', async () => {
      const read = { ...mockNotification, isRead: true };
      repo.findOne.mockResolvedValue(read);

      const result = await service.markAsRead('n-1', 'u-1');

      expect(repo.save).not.toHaveBeenCalled();
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should execute update query', async () => {
      const qb = createMockQueryBuilder([]);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.markAllAsRead('u-1');

      expect(qb.update).toHaveBeenCalled();
      expect(qb.andWhere).toHaveBeenCalledWith('is_read = :isRead', {
        isRead: false,
      });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should count unread notifications', async () => {
      repo.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('u-1');

      expect(repo.count).toHaveBeenCalledWith({
        where: { userId: 'u-1', isRead: false },
      });
      expect(result).toBe(3);
    });
  });
});
