import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PendingItemsService } from './pending-items.service';
import { PendingItem } from './entities/pending-item.entity';
import { User } from '../users/entities/user.entity';
import { PendingItemType } from './enums/pending-item-type.enum';
import { PendingItemPriority } from './enums/pending-item-priority.enum';
import { PendingItemStatus } from './enums/pending-item-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('PendingItemsService', () => {
  let service: PendingItemsService;
  let pendingItemRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: { emit: jest.Mock };

  const mockPendingItem: PendingItem = Object.assign(new PendingItem(), {
    id: 'pi-1',
    title: 'Revisar garantía',
    description: 'Verificar garantía del proveedor',
    dueDate: new Date('2026-06-20'),
    type: PendingItemType.WORK_ORDER,
    priority: PendingItemPriority.HIGH,
    status: PendingItemStatus.PENDING,
    referenceType: 'work_order',
    referenceId: 'wo-1',
    assignedToId: 'tech-1',
    createdById: 'admin-1',
    completedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });

  beforeEach(async () => {
    pendingItemRepo = createMockRepository();
    userRepo = createMockRepository();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingItemsService,
        {
          provide: getRepositoryToken(PendingItem),
          useValue: pendingItemRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<PendingItemsService>(PendingItemsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      title: 'Revisar garantía',
      dueDate: '2026-06-20',
      type: PendingItemType.WORK_ORDER,
    };

    it('should create a pending item', async () => {
      pendingItemRepo.create.mockReturnValue(mockPendingItem);
      pendingItemRepo.save.mockResolvedValue(mockPendingItem);

      const result = await service.create(dto, 'admin-1', UserRole.ADMIN);

      expect(pendingItemRepo.create).toHaveBeenCalled();
      expect(pendingItemRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockPendingItem);
    });

    it('should emit pending_item.created event', async () => {
      pendingItemRepo.create.mockReturnValue(mockPendingItem);
      pendingItemRepo.save.mockResolvedValue(mockPendingItem);

      await service.create(dto, 'admin-1', UserRole.ADMIN);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'pending_item.created',
        expect.objectContaining({
          pendingItemId: 'pi-1',
          title: 'Revisar garantía',
        }),
      );
    });

    it('should restrict technician to work_order reference type', async () => {
      const techDto = {
        ...dto,
        referenceType: 'maintenance',
      };

      await expect(
        service.create(techDto, 'tech-1', UserRole.TECHNICIAN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should auto-assign technician to themselves if no assignedToId', async () => {
      const techDto = {
        ...dto,
        referenceType: 'work_order',
      };
      pendingItemRepo.create.mockReturnValue(mockPendingItem);
      pendingItemRepo.save.mockResolvedValue(mockPendingItem);

      await service.create(techDto, 'tech-1', UserRole.TECHNICIAN);

      expect(pendingItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedToId: 'tech-1',
          createdById: 'tech-1',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated pending items', async () => {
      const items = [mockPendingItem];
      pendingItemRepo.createQueryBuilder.mockReturnValue({
        ...pendingItemRepo.createQueryBuilder(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([items, 1]),
      });

      const result = await service.findAll({}, 'admin-1', UserRole.ADMIN);

      expect(result.data).toEqual(items);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const qb = {
        ...pendingItemRepo.createQueryBuilder(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      pendingItemRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(
        { status: PendingItemStatus.PENDING },
        'admin-1',
        UserRole.ADMIN,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('pi.status = :status', {
        status: PendingItemStatus.PENDING,
      });
    });
  });

  describe('findOne', () => {
    it('should return a pending item by id', async () => {
      pendingItemRepo.findOne.mockResolvedValue(mockPendingItem);

      const result = await service.findOne('pi-1');

      expect(result).toEqual(mockPendingItem);
    });

    it('should throw NotFoundException when not found', async () => {
      pendingItemRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a pending item', async () => {
      pendingItemRepo.findOne.mockResolvedValue({ ...mockPendingItem });
      pendingItemRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('pi-1', {
        title: 'Updated title',
      });

      expect(pendingItemRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should set completedAt when marking as completed', async () => {
      pendingItemRepo.findOne.mockResolvedValue({
        ...mockPendingItem,
        status: PendingItemStatus.PENDING,
      });
      pendingItemRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('pi-1', {
        status: PendingItemStatus.COMPLETED,
      });

      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should clear completedAt when un-completing', async () => {
      pendingItemRepo.findOne.mockResolvedValue({
        ...mockPendingItem,
        status: PendingItemStatus.COMPLETED,
        completedAt: new Date(),
      });
      pendingItemRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update('pi-1', {
        status: PendingItemStatus.PENDING,
      });

      expect(result.completedAt).toBeNull();
    });

    it('should throw NotFoundException when not found', async () => {
      pendingItemRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft remove a pending item', async () => {
      pendingItemRepo.findOne.mockResolvedValue(mockPendingItem);

      await service.remove('pi-1');

      expect(pendingItemRepo.softRemove).toHaveBeenCalledWith(mockPendingItem);
    });

    it('should throw NotFoundException when not found', async () => {
      pendingItemRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
