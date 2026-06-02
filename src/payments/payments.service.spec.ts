import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { CashProvider } from './providers/cash.provider';
import { TransferProvider } from './providers/transfer.provider';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../common/testing/mock-query-builder.helper';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mockRepo: ReturnType<typeof createMockRepository>;
  let mockMercadoPago: {
    createPayment: jest.Mock;
    getPaymentStatus: jest.Mock;
    handleWebhook: jest.Mock;
  };
  let mockCash: {
    createPayment: jest.Mock;
    getPaymentStatus: jest.Mock;
    handleWebhook: jest.Mock;
  };
  let mockTransfer: {
    createPayment: jest.Mock;
    getPaymentStatus: jest.Mock;
    handleWebhook: jest.Mock;
  };
  let mockEventEmitter: {
    emit: jest.Mock;
  };

  const workOrderId = 'wo-uuid-1';

  const createMockPayment = (): Payment => ({
    id: 'pay-uuid-1',
    amount: 5000,
    currency: 'ARS',
    method: PaymentMethod.CASH,
    status: PaymentStatus.APPROVED,
    provider: 'cash',
    providerPaymentId: 'cash-123',
    description: 'Pago para orden de trabajo',
    installmentNumber: 1,
    totalInstallments: 1,
    dueDate: undefined as unknown as Date,
    paidAt: new Date('2026-01-15'),
    metadata: { amount: 5000, description: 'test' },
    workOrder: undefined as never,
    workOrderId,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    deletedAt: undefined,
  });

  const createMockPendingPayment = (): Payment => ({
    ...createMockPayment(),
    id: 'pay-uuid-2',
    status: PaymentStatus.PENDING,
    provider: 'transfer',
    providerPaymentId: 'transfer-456',
    paidAt: undefined as unknown as Date,
  });

  beforeEach(async () => {
    mockRepo = createMockRepository();
    mockMercadoPago = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      handleWebhook: jest.fn(),
    };
    mockCash = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      handleWebhook: jest.fn(),
    };
    mockTransfer = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
      handleWebhook: jest.fn(),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockRepo,
        },
        {
          provide: MercadoPagoProvider,
          useValue: mockMercadoPago,
        },
        {
          provide: CashProvider,
          useValue: mockCash,
        },
        {
          provide: TransferProvider,
          useValue: mockTransfer,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a payment with cash provider and emit events', async () => {
      const dto: CreatePaymentDto = {
        amount: 5000,
        method: PaymentMethod.CASH,
        provider: 'cash',
        description: 'Test payment',
      };
      const mockPay = createMockPayment();

      mockCash.createPayment.mockResolvedValue({
        providerPaymentId: 'cash-123',
        status: PaymentStatus.APPROVED,
        metadata: { amount: 5000 },
      });
      mockRepo.create.mockReturnValue(mockPay);
      mockRepo.save.mockResolvedValue(mockPay);

      const result = await service.create(workOrderId, dto);

      expect(mockCash.createPayment).toHaveBeenCalledWith(5000, 'Test payment');
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockPay);
    });

    it('should use default description when not provided', async () => {
      const dto: CreatePaymentDto = {
        amount: 3000,
        method: PaymentMethod.TRANSFER,
        provider: 'transfer',
      };
      const pendingPay = createMockPendingPayment();

      mockTransfer.createPayment.mockResolvedValue({
        providerPaymentId: 'transfer-789',
        status: PaymentStatus.PENDING,
        metadata: {},
      });
      mockRepo.create.mockReturnValue(pendingPay);
      mockRepo.save.mockResolvedValue(pendingPay);

      await service.create(workOrderId, dto);

      expect(mockTransfer.createPayment).toHaveBeenCalledWith(
        3000,
        'Pago para orden de trabajo',
      );
    });

    it('should emit payment.created event', async () => {
      const dto: CreatePaymentDto = {
        amount: 5000,
        method: PaymentMethod.CASH,
        provider: 'cash',
      };
      const mockPay = createMockPayment();

      mockCash.createPayment.mockResolvedValue({
        providerPaymentId: 'cash-123',
        status: PaymentStatus.APPROVED,
        metadata: {},
      });
      mockRepo.create.mockReturnValue(mockPay);
      mockRepo.save.mockResolvedValue(mockPay);

      await service.create(workOrderId, dto);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.created',
        expect.objectContaining({
          paymentId: mockPay.id,
          amount: mockPay.amount,
          method: mockPay.method,
          workOrderId,
        }),
      );
    });

    it('should emit payment.status_changed event when status is APPROVED', async () => {
      const dto: CreatePaymentDto = {
        amount: 5000,
        method: PaymentMethod.CASH,
        provider: 'cash',
      };
      const mockPay = createMockPayment();

      mockCash.createPayment.mockResolvedValue({
        providerPaymentId: 'cash-123',
        status: PaymentStatus.APPROVED,
        metadata: {},
      });
      mockRepo.create.mockReturnValue(mockPay);
      mockRepo.save.mockResolvedValue(mockPay);

      await service.create(workOrderId, dto);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.status_changed',
        expect.objectContaining({
          paymentId: mockPay.id,
          newStatus: PaymentStatus.APPROVED,
          workOrderId,
        }),
      );
    });

    it('should not emit payment.status_changed event when status is not APPROVED', async () => {
      const dto: CreatePaymentDto = {
        amount: 3000,
        method: PaymentMethod.TRANSFER,
        provider: 'transfer',
      };
      const pendingPay = createMockPendingPayment();

      mockTransfer.createPayment.mockResolvedValue({
        providerPaymentId: 'transfer-456',
        status: PaymentStatus.PENDING,
        metadata: {},
      });
      mockRepo.create.mockReturnValue(pendingPay);
      mockRepo.save.mockResolvedValue(pendingPay);

      await service.create(workOrderId, dto);

      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.created',
        expect.anything(),
      );
    });

    it('should set paidAt when status is APPROVED', async () => {
      const dto: CreatePaymentDto = {
        amount: 5000,
        method: PaymentMethod.CASH,
        provider: 'cash',
      };
      const mockPay = createMockPayment();

      mockCash.createPayment.mockResolvedValue({
        providerPaymentId: 'cash-123',
        status: PaymentStatus.APPROVED,
        metadata: {},
      });
      mockRepo.create.mockReturnValue(mockPay);
      mockRepo.save.mockResolvedValue(mockPay);

      await service.create(workOrderId, dto);

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.paidAt).toBeInstanceOf(Date);
    });

    it('should not set paidAt when status is PENDING', async () => {
      const dto: CreatePaymentDto = {
        amount: 3000,
        method: PaymentMethod.TRANSFER,
        provider: 'transfer',
      };
      const pendingPay = createMockPendingPayment();

      mockTransfer.createPayment.mockResolvedValue({
        providerPaymentId: 'transfer-456',
        status: PaymentStatus.PENDING,
        metadata: {},
      });
      mockRepo.create.mockReturnValue(pendingPay);
      mockRepo.save.mockResolvedValue(pendingPay);

      await service.create(workOrderId, dto);

      const createCall = mockRepo.create.mock.calls[0][0];
      expect(createCall.paidAt).toBeUndefined();
    });

    it('should throw BadRequestException for unknown provider', async () => {
      const dto: CreatePaymentDto = {
        amount: 5000,
        method: PaymentMethod.CASH,
        provider: 'unknown',
      };

      await expect(service.create(workOrderId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(workOrderId, dto)).rejects.toThrow(
        'Unknown payment provider: unknown',
      );
    });

    it('should use mercadopago provider', async () => {
      const dto: CreatePaymentDto = {
        amount: 10000,
        method: PaymentMethod.CREDIT_CARD,
        provider: 'mercadopago',
      };
      const mockPay = createMockPayment();
      const mpPayment = {
        ...mockPay,
        provider: 'mercadopago',
        status: PaymentStatus.PENDING,
      };

      mockMercadoPago.createPayment.mockResolvedValue({
        providerPaymentId: 'mp-789',
        status: PaymentStatus.PENDING,
        metadata: { mp_status: 'pending' },
      });
      mockRepo.create.mockReturnValue(mpPayment);
      mockRepo.save.mockResolvedValue(mpPayment);

      const result = await service.create(workOrderId, dto);

      expect(mockMercadoPago.createPayment).toHaveBeenCalledWith(
        10000,
        'Pago para orden de trabajo',
      );
      expect(result).toEqual(mpPayment);
    });
  });

  describe('findAll', () => {
    it('should return paginated payments with default filters', async () => {
      const filterDto: FilterPaymentDto = {};
      const mockPay = createMockPayment();
      const pendingPay = createMockPendingPayment();
      const payments = [mockPay, pendingPay];
      const mockQb = createMockQueryBuilder(payments, 2);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(workOrderId, filterDto);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(mockQb.where).toHaveBeenCalledWith(
        'p.work_order_id = :workOrderId',
        { workOrderId },
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith('p.createdAt', 'ASC');
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(mockQb.getManyAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(payments);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply status filter', async () => {
      const filterDto: FilterPaymentDto = {
        status: PaymentStatus.APPROVED,
      };
      const mockPay = createMockPayment();
      const mockQb = createMockQueryBuilder([mockPay], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(workOrderId, filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith('p.status = :status', {
        status: PaymentStatus.APPROVED,
      });
    });

    it('should apply method filter', async () => {
      const filterDto: FilterPaymentDto = {
        method: PaymentMethod.CASH,
      };
      const mockPay = createMockPayment();
      const mockQb = createMockQueryBuilder([mockPay], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(workOrderId, filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith('p.method = :method', {
        method: PaymentMethod.CASH,
      });
    });

    it('should apply dateFrom filter', async () => {
      const filterDto: FilterPaymentDto = {
        dateFrom: '2026-01-01',
      };
      const mockPay = createMockPayment();
      const mockQb = createMockQueryBuilder([mockPay], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(workOrderId, filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'p.created_at >= :dateFrom',
        { dateFrom: '2026-01-01' },
      );
    });

    it('should apply dateTo filter', async () => {
      const filterDto: FilterPaymentDto = {
        dateTo: '2026-12-31',
      };
      const mockPay = createMockPayment();
      const mockQb = createMockQueryBuilder([mockPay], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(workOrderId, filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith('p.created_at <= :dateTo', {
        dateTo: '2026-12-31',
      });
    });

    it('should apply all filters together', async () => {
      const filterDto: FilterPaymentDto = {
        status: PaymentStatus.APPROVED,
        method: PaymentMethod.CASH,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        page: 2,
        limit: 5,
        sortBy: 'amount',
        order: 'DESC',
      };
      const mockPay = createMockPayment();
      const mockQb = createMockQueryBuilder([mockPay], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(workOrderId, filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledTimes(4);
      expect(mockQb.orderBy).toHaveBeenCalledWith('p.amount', 'DESC');
      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should not apply optional filters when not provided', async () => {
      const filterDto: FilterPaymentDto = { page: 1, limit: 10 };
      const mockQb = createMockQueryBuilder([], 0);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(workOrderId, filterDto);

      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });

    it('should return empty result', async () => {
      const filterDto: FilterPaymentDto = {};
      const mockQb = createMockQueryBuilder([], 0);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(workOrderId, filterDto);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', async () => {
      const filterDto: FilterPaymentDto = { page: 1, limit: 3 };
      const mockPay = createMockPayment();
      const mockQb = createMockQueryBuilder([mockPay], 7);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(workOrderId, filterDto);

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const mockPay = createMockPayment();
      mockRepo.findOne.mockResolvedValue(mockPay);

      const result = await service.findOne('pay-uuid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pay-uuid-1' },
        relations: { workOrder: true },
      });
      expect(result).toEqual(mockPay);
    });

    it('should throw NotFoundException when payment not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Payment #non-existent not found',
      );
    });
  });

  describe('findOneByWorkOrder', () => {
    it('should return a payment by workOrderId and paymentId', async () => {
      const mockPay = createMockPayment();
      mockRepo.findOne.mockResolvedValue(mockPay);

      const result = await service.findOneByWorkOrder(
        workOrderId,
        'pay-uuid-1',
      );

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pay-uuid-1', workOrderId },
      });
      expect(result).toEqual(mockPay);
    });

    it('should throw NotFoundException when payment not found in work order', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByWorkOrder(workOrderId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findOneByWorkOrder(workOrderId, 'non-existent'),
      ).rejects.toThrow(
        `Payment #non-existent not found in work order #${workOrderId}`,
      );
    });
  });

  describe('update', () => {
    it('should update and return the payment', async () => {
      const dto: UpdatePaymentDto = {
        status: PaymentStatus.APPROVED,
      };
      const pendingPay = createMockPendingPayment();
      const updatedPayment = {
        ...pendingPay,
        status: PaymentStatus.APPROVED,
        paidAt: new Date(),
      };

      mockRepo.findOne.mockResolvedValue(pendingPay);
      mockRepo.save.mockResolvedValue(updatedPayment);

      const result = await service.update('pay-uuid-2', dto);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'pay-uuid-2' },
        relations: { workOrder: true },
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.APPROVED);
    });

    it('should throw NotFoundException when updating non-existent payment', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { status: PaymentStatus.APPROVED }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set paidAt when status changes to APPROVED and paidAt is not set', async () => {
      const dto: UpdatePaymentDto = {
        status: PaymentStatus.APPROVED,
      };
      const pendingPay = createMockPendingPayment();

      mockRepo.findOne.mockResolvedValue(pendingPay);
      mockRepo.save.mockImplementation((p: Payment) => Promise.resolve(p));

      await service.update('pay-uuid-2', dto);

      const savedEntity = mockRepo.save.mock.calls[0][0];
      expect(savedEntity.paidAt).toBeInstanceOf(Date);
    });

    it('should not overwrite paidAt when already set', async () => {
      const existingPaidAt = new Date('2025-06-01');
      const mockPay = createMockPayment();
      const paymentWithPaidAt = { ...mockPay, paidAt: existingPaidAt };
      const dto: UpdatePaymentDto = {
        status: PaymentStatus.APPROVED,
      };

      mockRepo.findOne.mockResolvedValue(paymentWithPaidAt);
      mockRepo.save.mockImplementation((p: Payment) => Promise.resolve(p));

      await service.update('pay-uuid-1', dto);

      const savedEntity = mockRepo.save.mock.calls[0][0];
      expect(savedEntity.paidAt).toEqual(existingPaidAt);
    });

    it('should emit payment.status_changed event when status changes', async () => {
      const dto: UpdatePaymentDto = {
        status: PaymentStatus.APPROVED,
      };
      const pendingPay = createMockPendingPayment();
      const updatedPayment = {
        ...pendingPay,
        status: PaymentStatus.APPROVED,
      };

      mockRepo.findOne.mockResolvedValue(pendingPay);
      mockRepo.save.mockResolvedValue(updatedPayment);

      await service.update('pay-uuid-2', dto);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.status_changed',
        expect.objectContaining({
          paymentId: updatedPayment.id,
          newStatus: PaymentStatus.APPROVED,
          workOrderId: updatedPayment.workOrderId,
        }),
      );
    });

    it('should not emit event when status does not change', async () => {
      const dto: UpdatePaymentDto = {
        description: 'Updated description',
      };
      const mockPay = createMockPayment();

      mockRepo.findOne.mockResolvedValue(mockPay);
      mockRepo.save.mockResolvedValue({ ...mockPay, ...dto });

      await service.update('pay-uuid-1', dto);

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should not emit event when status is same value', async () => {
      const dto: UpdatePaymentDto = {
        status: PaymentStatus.APPROVED,
      };
      const mockPay = createMockPayment();

      mockRepo.findOne.mockResolvedValue(mockPay);
      mockRepo.save.mockResolvedValue(mockPay);

      await service.update('pay-uuid-1', dto);

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleMercadoPagoWebhook', () => {
    it('should update payment status from webhook result', async () => {
      const webhookBody = { type: 'payment', data: { id: 'mp-123' } };
      const webhookResult = {
        providerPaymentId: 'mp-123',
        status: PaymentStatus.APPROVED,
        metadata: { mp_status: 'approved' },
      };
      const mockPay = createMockPayment();
      const existingPayment = {
        ...mockPay,
        providerPaymentId: 'mp-123',
        status: PaymentStatus.PENDING,
        paidAt: undefined as unknown as Date,
      };

      mockMercadoPago.handleWebhook.mockResolvedValue(webhookResult);
      mockRepo.findOne.mockResolvedValue(existingPayment);
      mockRepo.save.mockResolvedValue({
        ...existingPayment,
        status: PaymentStatus.APPROVED,
      });

      await service.handleMercadoPagoWebhook(webhookBody);

      expect(mockMercadoPago.handleWebhook).toHaveBeenCalledWith(webhookBody);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { providerPaymentId: 'mp-123' },
      });
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should return early when webhook returns null', async () => {
      mockMercadoPago.handleWebhook.mockResolvedValue(null);

      await service.handleMercadoPagoWebhook({ type: 'other' });

      expect(mockRepo.findOne).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should return early when payment not found', async () => {
      const webhookResult = {
        providerPaymentId: 'mp-unknown',
        status: PaymentStatus.APPROVED,
      };

      mockMercadoPago.handleWebhook.mockResolvedValue(webhookResult);
      mockRepo.findOne.mockResolvedValue(null);

      await service.handleMercadoPagoWebhook({ type: 'payment' });

      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should set paidAt when webhook status is APPROVED', async () => {
      const webhookResult = {
        providerPaymentId: 'mp-123',
        status: PaymentStatus.APPROVED,
        metadata: {},
      };
      const mockPay = createMockPayment();
      const existingPayment = {
        ...mockPay,
        providerPaymentId: 'mp-123',
        status: PaymentStatus.PENDING,
        paidAt: undefined as unknown as Date,
      };

      mockMercadoPago.handleWebhook.mockResolvedValue(webhookResult);
      mockRepo.findOne.mockResolvedValue(existingPayment);
      mockRepo.save.mockImplementation((p: Payment) => Promise.resolve(p));

      await service.handleMercadoPagoWebhook({ type: 'payment' });

      const savedEntity = mockRepo.save.mock.calls[0][0];
      expect(savedEntity.paidAt).toBeInstanceOf(Date);
    });

    it('should merge webhook metadata into existing metadata', async () => {
      const webhookResult = {
        providerPaymentId: 'mp-123',
        status: PaymentStatus.APPROVED,
        metadata: { mp_status: 'approved', mp_status_detail: 'accredited' },
      };
      const mockPay = createMockPayment();
      const existingPayment = {
        ...mockPay,
        providerPaymentId: 'mp-123',
        status: PaymentStatus.PENDING,
        metadata: { existing_key: 'value' },
      };

      mockMercadoPago.handleWebhook.mockResolvedValue(webhookResult);
      mockRepo.findOne.mockResolvedValue(existingPayment);
      mockRepo.save.mockImplementation((p: Payment) => Promise.resolve(p));

      await service.handleMercadoPagoWebhook({ type: 'payment' });

      const savedEntity = mockRepo.save.mock.calls[0][0];
      expect(savedEntity.metadata).toEqual({
        existing_key: 'value',
        mp_status: 'approved',
        mp_status_detail: 'accredited',
      });
    });

    it('should emit payment.status_changed when status changes', async () => {
      const webhookResult = {
        providerPaymentId: 'mp-123',
        status: PaymentStatus.APPROVED,
        metadata: {},
      };
      const mockPay = createMockPayment();
      const existingPayment = {
        ...mockPay,
        providerPaymentId: 'mp-123',
        status: PaymentStatus.PENDING,
      };

      mockMercadoPago.handleWebhook.mockResolvedValue(webhookResult);
      mockRepo.findOne.mockResolvedValue(existingPayment);
      mockRepo.save.mockResolvedValue({
        ...existingPayment,
        status: PaymentStatus.APPROVED,
      });

      await service.handleMercadoPagoWebhook({ type: 'payment' });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'payment.status_changed',
        expect.objectContaining({
          newStatus: PaymentStatus.APPROVED,
        }),
      );
    });

    it('should not emit event when status does not change', async () => {
      const webhookResult = {
        providerPaymentId: 'mp-123',
        status: PaymentStatus.APPROVED,
        metadata: {},
      };
      const mockPay = createMockPayment();
      const existingPayment = {
        ...mockPay,
        providerPaymentId: 'mp-123',
        status: PaymentStatus.APPROVED,
      };

      mockMercadoPago.handleWebhook.mockResolvedValue(webhookResult);
      mockRepo.findOne.mockResolvedValue(existingPayment);
      mockRepo.save.mockResolvedValue(existingPayment);

      await service.handleMercadoPagoWebhook({ type: 'payment' });

      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
