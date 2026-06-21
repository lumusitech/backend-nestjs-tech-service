import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InquiriesService } from './inquiries.service';
import { Inquiry } from './entities/inquiry.entity';
import { User } from '../users/entities/user.entity';
import { InquirySource } from './enums/inquiry-source.enum';
import { InquiryStatus } from './enums/inquiry-status.enum';
import { InquiryRecommendation } from './enums/inquiry-recommendation.enum';
import { InquiryDecision } from './enums/inquiry-decision.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('InquiriesService', () => {
  let service: InquiriesService;
  let inquiryRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;
  let eventEmitter: { emit: jest.Mock };

  const mockInquiry: Inquiry = Object.assign(new Inquiry(), {
    id: 'iq-1',
    clientName: 'Juan Pérez',
    clientPhone: '+54 11 1234-5678',
    clientEmail: 'juan@email.com',
    clientAddress: 'Av. Corrientes 1234',
    description: 'La notebook no prende',
    source: InquirySource.PHONE,
    status: InquiryStatus.NEW,
    priority: 'high',
    assignedToId: null,
    createdById: 'admin-1',
    technicianNotes: null,
    estimatedCost: null,
    estimatedDuration: null,
    materialsNeeded: null,
    recommendation: null,
    adminDecision: InquiryDecision.PENDING,
    adminNotes: null,
    workOrderId: null,
    contactedAt: null,
    reviewedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });

  beforeEach(async () => {
    inquiryRepo = createMockRepository();
    userRepo = createMockRepository();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiriesService,
        {
          provide: getRepositoryToken(Inquiry),
          useValue: inquiryRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<InquiriesService>(InquiriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      clientName: 'Juan Pérez',
      description: 'La notebook no prende',
      source: InquirySource.PHONE,
    };

    it('should create an inquiry', async () => {
      inquiryRepo.create.mockReturnValue(mockInquiry);
      inquiryRepo.save.mockResolvedValue(mockInquiry);

      const result = await service.create(dto, 'admin-1');

      expect(inquiryRepo.create).toHaveBeenCalled();
      expect(inquiryRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockInquiry);
    });

    it('should emit inquiry.created event', async () => {
      inquiryRepo.create.mockReturnValue(mockInquiry);
      inquiryRepo.save.mockResolvedValue(mockInquiry);

      await service.create(dto, 'admin-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'inquiry.created',
        expect.objectContaining({
          inquiryId: 'iq-1',
          clientName: 'Juan Pérez',
        }),
      );
    });

    it('should emit inquiry.assigned event when assignedToId is provided', async () => {
      const assignedInquiry = { ...mockInquiry, assignedToId: 'tech-1' };
      inquiryRepo.create.mockReturnValue(assignedInquiry);
      inquiryRepo.save.mockResolvedValue(assignedInquiry);

      await service.create({ ...dto, assignedToId: 'tech-1' }, 'admin-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'inquiry.assigned',
        expect.objectContaining({
          inquiryId: 'iq-1',
          assignedToId: 'tech-1',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated inquiries', async () => {
      const inquiries = [mockInquiry];
      inquiryRepo.createQueryBuilder.mockReturnValue({
        ...inquiryRepo.createQueryBuilder(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([inquiries, 1]),
      });

      const result = await service.findAll({}, 'admin-1', UserRole.ADMIN);

      expect(result.data).toEqual(inquiries);
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      const qb = {
        ...inquiryRepo.createQueryBuilder(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      inquiryRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll(
        { status: InquiryStatus.NEW },
        'admin-1',
        UserRole.ADMIN,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('i.status = :status', {
        status: InquiryStatus.NEW,
      });
    });

    it('should restrict technician to only their assigned inquiries', async () => {
      const qb = {
        ...inquiryRepo.createQueryBuilder(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      inquiryRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({}, 'tech-1', UserRole.TECHNICIAN);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'i.assigned_to_id = :userId',
        { userId: 'tech-1' },
      );
    });
  });

  describe('findOne', () => {
    it('should return an inquiry by id', async () => {
      inquiryRepo.findOne.mockResolvedValue(mockInquiry);

      const result = await service.findOne('iq-1');

      expect(result).toEqual(mockInquiry);
    });

    it('should throw NotFoundException when not found', async () => {
      inquiryRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an inquiry', async () => {
      inquiryRepo.findOne.mockResolvedValue({ ...mockInquiry });
      inquiryRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('iq-1', {
        clientName: 'Updated Name',
      });

      expect(inquiryRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      inquiryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { clientName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('contact', () => {
    it('should mark inquiry as contacted', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.NEW,
      });
      inquiryRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.contact('iq-1', {
        technicianNotes: 'El ventilador está sucio',
        estimatedCost: 15000,
        estimatedDuration: 2,
        recommendation: InquiryRecommendation.REPAIR,
      });

      expect(result.status).toBe(InquiryStatus.CONTACTED);
      expect(result.contactedAt).toBeInstanceOf(Date);
      expect(result.technicianNotes).toBe('El ventilador está sucio');
    });

    it('should emit inquiry.contacted event', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.NEW,
      });
      inquiryRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.contact('iq-1', {
        technicianNotes: 'Notas de contacto',
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'inquiry.contacted',
        expect.objectContaining({
          inquiryId: 'iq-1',
          clientName: 'Juan Pérez',
        }),
      );
    });

    it('should reject if inquiry is not in NEW status', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.CONTACTED,
      });

      await expect(
        service.contact('iq-1', { technicianNotes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('review', () => {
    it('should mark inquiry as reviewed', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.CONTACTED,
      });
      inquiryRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.review('iq-1', {
        adminDecision: InquiryDecision.APPROVED,
        adminNotes: 'Proceder con la reparación',
      });

      expect(result.status).toBe(InquiryStatus.REVIEWED);
      expect(result.reviewedAt).toBeInstanceOf(Date);
      expect(result.adminDecision).toBe(InquiryDecision.APPROVED);
    });

    it('should emit inquiry.reviewed event', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.CONTACTED,
      });
      inquiryRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      await service.review('iq-1', {
        adminDecision: InquiryDecision.APPROVED,
      });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'inquiry.reviewed',
        expect.objectContaining({
          inquiryId: 'iq-1',
          adminDecision: 'approved',
        }),
      );
    });

    it('should reject if inquiry is not in CONTACTED status', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.NEW,
      });

      await expect(
        service.review('iq-1', { adminDecision: InquiryDecision.APPROVED }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('convertToWorkOrder', () => {
    it('should convert approved reviewed inquiry', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.REVIEWED,
        adminDecision: InquiryDecision.APPROVED,
      });
      inquiryRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.convertToWorkOrder(
        'iq-1',
        'client-1',
        'st-1',
      );

      expect(result.status).toBe(InquiryStatus.CONVERTED);
    });

    it('should reject if inquiry is not REVIEWED', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.CONTACTED,
      });

      await expect(
        service.convertToWorkOrder('iq-1', 'client-1', 'st-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if admin did not approve', async () => {
      inquiryRepo.findOne.mockResolvedValue({
        ...mockInquiry,
        status: InquiryStatus.REVIEWED,
        adminDecision: InquiryDecision.REJECTED,
      });

      await expect(
        service.convertToWorkOrder('iq-1', 'client-1', 'st-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft remove an inquiry', async () => {
      inquiryRepo.findOne.mockResolvedValue(mockInquiry);

      await service.remove('iq-1');

      expect(inquiryRepo.softRemove).toHaveBeenCalledWith(mockInquiry);
    });

    it('should throw NotFoundException when not found', async () => {
      inquiryRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
