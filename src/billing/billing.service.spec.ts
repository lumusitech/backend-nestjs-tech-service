import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Invoice } from './entities/invoice.entity';
import { ArcaProvider } from './providers/arca.provider';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { InvoiceType } from './enums/invoice-type.enum';
import { InvoiceConcept } from './enums/invoice-concept.enum';
import { IvaCondition } from './enums/iva-condition.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../common/testing/mock-query-builder.helper';

describe('BillingService', () => {
  let service: BillingService;
  let mockRepo: ReturnType<typeof createMockRepository>;
  let mockArcaProvider: { issueInvoice: jest.Mock };

  const mockInvoice: Invoice = {
    id: 'inv-uuid-1',
    invoiceNumber: '0001-00000001',
    invoiceType: InvoiceType.A,
    pointOfSale: 1,
    concept: InvoiceConcept.SERVICES,
    status: InvoiceStatus.DRAFT,
    cae: '',
    caeExpiry: undefined as unknown as Date,
    issuedAt: undefined as unknown as Date,
    cancelledAt: undefined as unknown as Date,
    clientName: 'John Doe',
    clientCuit: '20-12345678-9',
    clientAddress: '123 Main St',
    clientIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
    subtotal: 10000,
    ivaAmount: 2100,
    total: 12100,
    workOrder: {} as never,
    workOrderId: 'wo-uuid-1',
    payment: undefined as never,
    paymentId: undefined as unknown as string,
    metadata: undefined as unknown as Record<string, unknown>,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockDraftInvoice: Invoice = {
    ...mockInvoice,
    id: 'inv-uuid-draft',
    status: InvoiceStatus.DRAFT,
  };

  const mockIssuedInvoice: Invoice = {
    ...mockInvoice,
    id: 'inv-uuid-issued',
    status: InvoiceStatus.ISSUED,
    cae: '12345678901234',
    caeExpiry: new Date('2026-01-11'),
    issuedAt: new Date('2026-01-01'),
  };

  const mockCancelledInvoice: Invoice = {
    ...mockInvoice,
    id: 'inv-uuid-cancelled',
    status: InvoiceStatus.CANCELLED,
    cae: '12345678901234',
    caeExpiry: new Date('2026-01-11'),
    issuedAt: new Date('2026-01-01'),
    cancelledAt: new Date('2026-01-05'),
  };

  const mockArcaResult = {
    cae: '98765432101234',
    caeExpiry: new Date('2026-01-11'),
    invoiceNumber: '0001-00000001',
    metadata: { stub: true },
  };

  beforeEach(async () => {
    mockRepo = createMockRepository();
    mockArcaProvider = {
      issueInvoice: jest.fn().mockResolvedValue(mockArcaResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockRepo,
        },
        {
          provide: ArcaProvider,
          useValue: mockArcaProvider,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('20-99999999-9') },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateInvoiceDto = {
      invoiceType: InvoiceType.A,
      clientName: 'John Doe',
      clientCuit: '20-12345678-9',
      clientAddress: '123 Main St',
      subtotal: 10000,
      ivaAmount: 2100,
      total: 12100,
      workOrderId: 'wo-uuid-1',
    };

    it('should create a draft invoice with auto-generated invoice number', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-inv-uuid' }),
      );

      const result = await service.create(createDto);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('i');
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(InvoiceStatus.DRAFT);
      expect(result.invoiceNumber).toBe('0001-00000001');
      expect(result.pointOfSale).toBe(1);
      expect(result.clientIvaCondition).toBe(IvaCondition.CONSUMIDOR_FINAL);
    });

    it('should increment invoice number based on last invoice', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue({ invoiceNumber: '0001-00000005' });
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-inv-uuid' }),
      );

      const result = await service.create(createDto);

      expect(result.invoiceNumber).toBe('0001-00000006');
    });

    it('should use custom pointOfSale when provided', async () => {
      const dtoWithPos: CreateInvoiceDto = { ...createDto, pointOfSale: 3 };
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-inv-uuid' }),
      );

      const result = await service.create(dtoWithPos);

      expect(result.invoiceNumber).toBe('0003-00000001');
      expect(result.pointOfSale).toBe(3);
    });

    it('should use default values for optional fields', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-inv-uuid' }),
      );

      const result = await service.create(createDto);

      expect(result.concept).toBeUndefined();
      expect(result.ivaAmount).toBe(2100);
    });

    it('should default ivaAmount to 0 when not provided', async () => {
      const dtoNoIva: CreateInvoiceDto = {
        invoiceType: InvoiceType.B,
        clientName: 'Jane Doe',
        clientAddress: '456 Oak Ave',
        subtotal: 5000,
        total: 5000,
        workOrderId: 'wo-uuid-2',
      };
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-inv-uuid' }),
      );

      const result = await service.create(dtoNoIva);

      expect(result.ivaAmount).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices with default filters', async () => {
      const invoices = [mockInvoice];
      const mockQb = createMockQueryBuilder(invoices, 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({});

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('i');
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith(
        'i.workOrder',
        'workOrder',
      );
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith(
        'workOrder.client',
        'client',
      );
      expect(mockQb.leftJoinAndSelect).toHaveBeenCalledWith(
        'workOrder.serviceType',
        'serviceType',
      );
      expect(mockQb.orderBy).toHaveBeenCalledWith('i.createdAt', 'DESC');
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(mockQb.getManyAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(invoices);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply status filter', async () => {
      const mockQb = createMockQueryBuilder([mockDraftInvoice], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ status: InvoiceStatus.DRAFT });

      expect(mockQb.andWhere).toHaveBeenCalledWith('i.status = :status', {
        status: InvoiceStatus.DRAFT,
      });
    });

    it('should apply invoiceType filter', async () => {
      const mockQb = createMockQueryBuilder([mockInvoice], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ invoiceType: InvoiceType.A });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'i.invoice_type = :invoiceType',
        { invoiceType: InvoiceType.A },
      );
    });

    it('should apply dateFrom filter', async () => {
      const mockQb = createMockQueryBuilder([mockInvoice], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ dateFrom: '2026-01-01' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'i.created_at >= :dateFrom',
        { dateFrom: '2026-01-01' },
      );
    });

    it('should apply dateTo filter', async () => {
      const mockQb = createMockQueryBuilder([mockInvoice], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ dateTo: '2026-12-31' });

      expect(mockQb.andWhere).toHaveBeenCalledWith('i.created_at <= :dateTo', {
        dateTo: '2026-12-31',
      });
    });

    it('should apply clientName filter with unaccent', async () => {
      const mockQb = createMockQueryBuilder([mockInvoice], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ clientName: 'John' });

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'unaccent(i.client_name) ILIKE unaccent(:clientName)',
        { clientName: '%John%' },
      );
    });

    it('should apply all filters together', async () => {
      const mockQb = createMockQueryBuilder([mockInvoice], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({
        status: InvoiceStatus.ISSUED,
        invoiceType: InvoiceType.A,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        clientName: 'Doe',
        page: 2,
        limit: 5,
        sortBy: 'total',
        order: 'ASC',
      });

      expect(mockQb.andWhere).toHaveBeenCalledTimes(5);
      expect(mockQb.orderBy).toHaveBeenCalledWith('i.total', 'ASC');
      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should not apply optional filters when not provided', async () => {
      const mockQb = createMockQueryBuilder([], 0);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ page: 1, limit: 10 });

      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });

    it('should return empty result', async () => {
      const mockQb = createMockQueryBuilder([], 0);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', async () => {
      const mockQb = createMockQueryBuilder([mockInvoice], 7);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({ page: 1, limit: 3 });

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return an invoice by id with relations', async () => {
      mockRepo.findOne.mockResolvedValue(mockInvoice);

      const result = await service.findOne('inv-uuid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'inv-uuid-1' },
        relations: {
          workOrder: { client: true, serviceType: true },
          payment: true,
        },
      });
      expect(result).toEqual(mockInvoice);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Invoice #non-existent not found',
      );
    });
  });

  describe('issue', () => {
    it('should issue a draft invoice', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockDraftInvoice });
      mockRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity as Invoice),
      );

      const result = await service.issue('inv-uuid-draft');

      expect(mockArcaProvider.issueInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: mockDraftInvoice.invoiceNumber,
          invoiceType: mockDraftInvoice.invoiceType,
          pointOfSale: mockDraftInvoice.pointOfSale,
          subtotal: mockDraftInvoice.subtotal,
          ivaAmount: mockDraftInvoice.ivaAmount,
          total: mockDraftInvoice.total,
        }),
      );
      expect(result.status).toBe(InvoiceStatus.ISSUED);
      expect(result.cae).toBe(mockArcaResult.cae);
      expect(result.caeExpiry).toBe(mockArcaResult.caeExpiry);
      expect(result.issuedAt).toBeInstanceOf(Date);
      expect(result.metadata).toEqual(mockArcaResult.metadata);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when invoice is already issued', async () => {
      mockRepo.findOne.mockResolvedValue(mockIssuedInvoice);

      await expect(service.issue('inv-uuid-issued')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.issue('inv-uuid-issued')).rejects.toThrow(
        'Cannot issue invoice with status issued',
      );
    });

    it('should throw BadRequestException when invoice is already cancelled', async () => {
      mockRepo.findOne.mockResolvedValue(mockCancelledInvoice);

      await expect(service.issue('inv-uuid-cancelled')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.issue('inv-uuid-cancelled')).rejects.toThrow(
        'Cannot issue invoice with status cancelled',
      );
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.issue('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel an issued invoice', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockIssuedInvoice });
      mockRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity as Invoice),
      );

      const result = await service.cancel('inv-uuid-issued');

      expect(result.status).toBe(InvoiceStatus.CANCELLED);
      expect(result.cancelledAt).toBeInstanceOf(Date);
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when invoice is already cancelled', async () => {
      mockRepo.findOne.mockResolvedValue(mockCancelledInvoice);

      await expect(service.cancel('inv-uuid-cancelled')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel('inv-uuid-cancelled')).rejects.toThrow(
        'Invoice is already cancelled.',
      );
    });

    it('should throw BadRequestException when invoice is a draft', async () => {
      mockRepo.findOne.mockResolvedValue(mockDraftInvoice);

      await expect(service.cancel('inv-uuid-draft')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancel('inv-uuid-draft')).rejects.toThrow(
        'Cannot cancel a DRAFT invoice',
      );
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.cancel('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('invoice number generation', () => {
    const baseCreateDto = {
      invoiceType: InvoiceType.A,
      clientName: 'Test',
      clientAddress: 'Addr',
      subtotal: 100,
      total: 100,
      workOrderId: 'wo-1',
    };

    it('should generate first invoice number as 0001-00000001 when no previous invoices exist', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      const result = await service.create(baseCreateDto);

      expect(result.invoiceNumber).toBe('0001-00000001');
    });

    it('should pad point of sale to 4 digits', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      const result = await service.create({
        ...baseCreateDto,
        pointOfSale: 7,
        invoiceType: InvoiceType.B,
      });

      expect(result.invoiceNumber).toBe('0007-00000001');
    });

    it('should pad invoice sequence number to 8 digits', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      const result = await service.create({
        ...baseCreateDto,
        invoiceType: InvoiceType.C,
      });

      expect(result.invoiceNumber).toMatch(/^\d{4}-\d{8}$/);
    });

    it('should increment from 0001-00000099 to 0001-00000100', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue({ invoiceNumber: '0001-00000099' });
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      const result = await service.create(baseCreateDto);

      expect(result.invoiceNumber).toBe('0001-00000100');
    });

    it('should start from 1 when last invoice number has no hyphen', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue({ invoiceNumber: 'nohyphen' });
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      const result = await service.create(baseCreateDto);

      expect(result.invoiceNumber).toBe('0001-00000001');
    });

    it('should produce NaN sequence when last invoice number second part is not numeric', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue({ invoiceNumber: '0001-notanumber' });
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      const result = await service.create(baseCreateDto);

      expect(result.invoiceNumber).toBe('0001-00000NaN');
    });

    it('should query with correct type and pointOfSale', async () => {
      const qb = createMockQueryBuilder([], 0);
      qb.getOne.mockResolvedValue(null);
      mockRepo.createQueryBuilder.mockReturnValue(qb);
      mockRepo.create.mockImplementation((dto: Invoice) => dto);
      mockRepo.save.mockImplementation((entity: Invoice) =>
        Promise.resolve({ ...entity, id: 'new-uuid' }),
      );

      await service.create({
        ...baseCreateDto,
        invoiceType: InvoiceType.B,
        pointOfSale: 5,
      });

      expect(qb.where).toHaveBeenCalledWith('i.invoice_type = :type', {
        type: InvoiceType.B,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('i.point_of_sale = :pos', {
        pos: 5,
      });
    });
  });
});
