import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PortalService } from './portal.service';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { WorkOrderStatus } from '../common/enums/work-order-status.enum';
import { Priority } from '../common/enums/priority.enum';
import { WorkOrderLocation } from '../work-orders/enums/work-order-location.enum';
import { NoteType } from '../work-orders/enums/note-type.enum';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('PortalService', () => {
  let service: PortalService;
  let mockWorkOrderRepo: ReturnType<typeof createMockRepository>;
  let mockPaymentRepo: ReturnType<typeof createMockRepository>;

  const mockWorkOrder = {
    id: 'wo-uuid-1',
    trackingCode: 'TS-A1B2C3',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    location: WorkOrderLocation.ON_SITE,
    diagnosis: 'Broken screen',
    scheduledDate: new Date('2026-06-10'),
    startedAt: new Date('2026-06-10T09:00:00'),
    completedAt: null,
    warrantyUntil: new Date('2026-09-10'),
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    client: {
      id: 'client-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456',
    },
    serviceType: {
      id: 'st-1',
      name: 'Screen Replacement',
      description: 'Replace broken screens',
    },
    tasks: [
      {
        id: 'task-1',
        title: 'Remove broken screen',
        description: 'Carefully remove the damaged screen',
        isCompleted: true,
        completedAt: new Date('2026-06-10T10:00:00'),
      },
      {
        id: 'task-2',
        title: 'Install new screen',
        description: 'Install replacement screen',
        isCompleted: false,
        completedAt: null,
      },
    ],
    notes: [
      {
        id: 'note-1',
        type: NoteType.DIAGNOSIS,
        content: 'LCD panel cracked',
        createdAt: new Date('2026-06-02'),
      },
      {
        id: 'note-2',
        type: NoteType.INTERNAL,
        content: 'Client is difficult',
        createdAt: new Date('2026-06-03'),
      },
      {
        id: 'note-3',
        type: NoteType.OBSERVATION,
        content: 'Screen protector was on',
        createdAt: new Date('2026-06-04'),
      },
    ],
  };

  beforeEach(async () => {
    mockWorkOrderRepo = createMockRepository();
    mockPaymentRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: mockWorkOrderRepo,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
      ],
    }).compile();

    service = module.get<PortalService>(PortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackByCode', () => {
    it('should return sanitized work order data for valid tracking code', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(mockWorkOrderRepo.findOne).toHaveBeenCalledWith({
        where: { trackingCode: 'TS-A1B2C3' },
        relations: {
          client: true,
          serviceType: true,
          tasks: true,
          notes: true,
        },
      });
      expect(result.trackingCode).toBe('TS-A1B2C3');
      expect(result.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(result.priority).toBe(Priority.HIGH);
      expect(result.location).toBe(WorkOrderLocation.ON_SITE);
      expect(result.diagnosis).toBe('Broken screen');
      expect(result.clientName).toBe('John Doe');
      expect(result.serviceType.name).toBe('Screen Replacement');
      expect(result.serviceType.description).toBe('Replace broken screens');
    });

    it('should throw NotFoundException for invalid tracking code', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.trackByCode('INVALID')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.trackByCode('INVALID')).rejects.toThrow(
        "Work order with tracking code 'INVALID' not found",
      );
    });

    it('should filter out internal notes', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.publicNotes).toHaveLength(2);
      expect(
        result.publicNotes.every((n) => n.type !== NoteType.INTERNAL),
      ).toBe(true);
      expect(result.publicNotes[0].type).toBe(NoteType.DIAGNOSIS);
      expect(result.publicNotes[0].content).toBe('LCD panel cracked');
      expect(result.publicNotes[1].type).toBe(NoteType.OBSERVATION);
      expect(result.publicNotes[1].content).toBe('Screen protector was on');
    });

    it('should map tasks correctly', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0]).toEqual({
        title: 'Remove broken screen',
        description: 'Carefully remove the damaged screen',
        isCompleted: true,
        completedAt: new Date('2026-06-10T10:00:00'),
      });
      expect(result.tasks[1]).toEqual({
        title: 'Install new screen',
        description: 'Install replacement screen',
        isCompleted: false,
        completedAt: null,
      });
    });

    it('should not expose sensitive data like costs or internal notes', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result).not.toHaveProperty('materials');
      expect(result).not.toHaveProperty('technicians');
      expect(result).not.toHaveProperty('clientId');
      expect(result).not.toHaveProperty('serviceTypeId');
      expect(result).not.toHaveProperty('client');
    });

    it('should include all public date fields', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.scheduledDate).toEqual(new Date('2026-06-10'));
      expect(result.startedAt).toEqual(new Date('2026-06-10T09:00:00'));
      expect(result.completedAt).toBeNull();
      expect(result.warrantyUntil).toEqual(new Date('2026-09-10'));
      expect(result.createdAt).toEqual(new Date('2026-06-01'));
    });

    it('should handle work order with no notes', async () => {
      const woNoNotes = { ...mockWorkOrder, notes: [] };
      mockWorkOrderRepo.findOne.mockResolvedValue(woNoNotes);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.publicNotes).toEqual([]);
    });

    it('should handle work order with no tasks', async () => {
      const woNoTasks = { ...mockWorkOrder, tasks: [] };
      mockWorkOrderRepo.findOne.mockResolvedValue(woNoTasks);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.tasks).toEqual([]);
    });

    it('should handle work order with only internal notes', async () => {
      const woInternalOnly = {
        ...mockWorkOrder,
        notes: [
          {
            id: 'note-10',
            type: NoteType.INTERNAL,
            content: 'Internal only',
            createdAt: new Date('2026-06-05'),
          },
        ],
      };
      mockWorkOrderRepo.findOne.mockResolvedValue(woInternalOnly);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.publicNotes).toEqual([]);
    });
  });

  describe('buildPaymentSummary', () => {
    it('should return zero summary when no approved payments exist', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary).toEqual({
        totalApproved: 0,
        paymentCount: 0,
        hasPayments: false,
        isFullyPaid: false,
        installmentsPending: 0,
        installmentsTotal: 0,
      });
    });

    it('should calculate total approved from approved payments', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'p-1',
          amount: 5000,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
        {
          id: 'p-2',
          amount: 3000,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
      ]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary.totalApproved).toBe(8000);
      expect(result.paymentSummary.paymentCount).toBe(2);
      expect(result.paymentSummary.hasPayments).toBe(true);
      expect(result.paymentSummary.isFullyPaid).toBe(true);
    });

    it('should not include non-approved payments in total', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'p-1',
          amount: 5000,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
      ]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary.totalApproved).toBe(5000);
      expect(result.paymentSummary.paymentCount).toBe(1);
    });

    it('should calculate installment tracking correctly', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'p-1',
          amount: 3000,
          status: PaymentStatus.APPROVED,
          installmentNumber: 2,
          totalInstallments: 4,
        },
        {
          id: 'p-2',
          amount: 3000,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
      ]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary.installmentsTotal).toBe(4);
      expect(result.paymentSummary.installmentsPending).toBe(2);
    });

    it('should handle single installment payments (no installments)', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'p-1',
          amount: 1000,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
      ]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary.installmentsTotal).toBe(0);
      expect(result.paymentSummary.installmentsPending).toBe(0);
    });

    it('should handle decimal amounts correctly', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'p-1',
          amount: 1500.5,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
        {
          id: 'p-2',
          amount: 2499.75,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 1,
        },
      ]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary.totalApproved).toBe(4000.25);
    });

    it('should query payments with correct workOrderId and status', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([]);

      await service.trackByCode('TS-A1B2C3');

      expect(mockPaymentRepo.find).toHaveBeenCalledWith({
        where: {
          workOrderId: 'wo-uuid-1',
          status: PaymentStatus.APPROVED,
        },
      });
    });

    it('should handle fully paid installments', async () => {
      mockWorkOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      mockPaymentRepo.find.mockResolvedValue([
        {
          id: 'p-1',
          amount: 2500,
          status: PaymentStatus.APPROVED,
          installmentNumber: 1,
          totalInstallments: 3,
        },
        {
          id: 'p-2',
          amount: 2500,
          status: PaymentStatus.APPROVED,
          installmentNumber: 2,
          totalInstallments: 3,
        },
        {
          id: 'p-3',
          amount: 2500,
          status: PaymentStatus.APPROVED,
          installmentNumber: 3,
          totalInstallments: 3,
        },
      ]);

      const result = await service.trackByCode('TS-A1B2C3');

      expect(result.paymentSummary.installmentsTotal).toBe(3);
      expect(result.paymentSummary.installmentsPending).toBe(0);
    });
  });
});
