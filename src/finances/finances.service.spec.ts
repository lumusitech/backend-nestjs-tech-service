import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FinancesService } from './finances.service';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './enums/expense-category.enum';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../common/testing/mock-query-builder.helper';

describe('FinancesService', () => {
  let service: FinancesService;
  let mockRepo: ReturnType<typeof createMockRepository>;

  const mockExpense: Expense = {
    id: 'uuid-1',
    description: 'Electricity bill',
    amount: 15000,
    date: '2026-01-15',
    category: ExpenseCategory.UTILITIES,
    isRecurring: true,
    notes: 'Monthly payment',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: undefined,
  };

  const mockExpense2: Expense = {
    id: 'uuid-2',
    description: 'Screwdriver set',
    amount: 5000,
    date: '2026-02-10',
    category: ExpenseCategory.TOOLS,
    isRecurring: false,
    notes: '',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    mockRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FinancesService>(FinancesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return an expense', async () => {
      const dto: CreateExpenseDto = {
        description: 'Electricity bill',
        amount: 15000,
        date: '2026-01-15',
        category: ExpenseCategory.UTILITIES,
        isRecurring: true,
        notes: 'Monthly payment',
      };

      mockRepo.create.mockReturnValue(dto);
      mockRepo.save.mockResolvedValue(mockExpense);

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockExpense);
    });

    it('should create expense without optional fields', async () => {
      const dto: CreateExpenseDto = {
        description: 'One-time purchase',
        amount: 1000,
        date: '2026-03-01',
        category: ExpenseCategory.SUPPLIES,
      };

      const created = { ...mockExpense, ...dto, id: 'uuid-3' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result.description).toBe('One-time purchase');
    });
  });

  describe('findAll', () => {
    it('should return paginated expenses with default filters', async () => {
      const filterDto: FilterExpenseDto = {};
      const expenses = [mockExpense, mockExpense2];
      const mockQb = createMockQueryBuilder(expenses, 2);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(filterDto);

      expect(mockRepo.createQueryBuilder).toHaveBeenCalledWith('e');
      expect(mockQb.orderBy).toHaveBeenCalledWith('e.createdAt', 'ASC');
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(mockQb.getManyAndCount).toHaveBeenCalled();
      expect(result.data).toEqual(expenses);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply category filter', async () => {
      const filterDto: FilterExpenseDto = {
        category: ExpenseCategory.UTILITIES,
      };
      const mockQb = createMockQueryBuilder([mockExpense], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith('e.category = :category', {
        category: ExpenseCategory.UTILITIES,
      });
    });

    it('should apply dateFrom filter', async () => {
      const filterDto: FilterExpenseDto = {
        dateFrom: '2026-01-01',
      };
      const mockQb = createMockQueryBuilder([mockExpense], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith('e.date >= :dateFrom', {
        dateFrom: '2026-01-01',
      });
    });

    it('should apply dateTo filter', async () => {
      const filterDto: FilterExpenseDto = {
        dateTo: '2026-12-31',
      };
      const mockQb = createMockQueryBuilder([mockExpense], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith('e.date <= :dateTo', {
        dateTo: '2026-12-31',
      });
    });

    it('should apply isRecurring filter', async () => {
      const filterDto: FilterExpenseDto = {
        isRecurring: true,
      };
      const mockQb = createMockQueryBuilder([mockExpense], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'e.is_recurring = :isRecurring',
        { isRecurring: true },
      );
    });

    it('should apply all filters together', async () => {
      const filterDto: FilterExpenseDto = {
        category: ExpenseCategory.UTILITIES,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
        isRecurring: true,
        page: 2,
        limit: 5,
        sortBy: 'amount',
        order: 'DESC',
      };
      const mockQb = createMockQueryBuilder([mockExpense], 1);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledTimes(4);
      expect(mockQb.orderBy).toHaveBeenCalledWith('e.amount', 'DESC');
      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('should not apply optional filters when not provided', async () => {
      const filterDto: FilterExpenseDto = { page: 1, limit: 10 };
      const mockQb = createMockQueryBuilder([], 0);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll(filterDto);

      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });

    it('should return empty result', async () => {
      const filterDto: FilterExpenseDto = {};
      const mockQb = createMockQueryBuilder([], 0);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(filterDto);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', async () => {
      const filterDto: FilterExpenseDto = { page: 1, limit: 3 };
      const expenses = [mockExpense, mockExpense2];
      const mockQb = createMockQueryBuilder(expenses, 7);
      mockRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll(filterDto);

      expect(result.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return an expense by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockExpense);

      const result = await service.findOne('uuid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundException when expense not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Expense #non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the expense', async () => {
      const dto: UpdateExpenseDto = {
        description: 'Updated description',
        amount: 20000,
      };
      const updatedExpense = { ...mockExpense, ...dto };

      mockRepo.findOne.mockResolvedValue(mockExpense);
      mockRepo.save.mockResolvedValue(updatedExpense);

      const result = await service.update('uuid-1', dto);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
      expect(result.amount).toBe(20000);
    });

    it('should throw NotFoundException when updating non-existent expense', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const dto: UpdateExpenseDto = { notes: 'Updated notes only' };
      const updatedExpense = { ...mockExpense, notes: 'Updated notes only' };

      mockRepo.findOne.mockResolvedValue(mockExpense);
      mockRepo.save.mockResolvedValue(updatedExpense);

      const result = await service.update('uuid-1', dto);

      expect(result.notes).toBe('Updated notes only');
      expect(result.description).toBe(mockExpense.description);
    });
  });

  describe('remove', () => {
    it('should soft remove the expense', async () => {
      mockRepo.findOne.mockResolvedValue(mockExpense);
      mockRepo.softRemove.mockResolvedValue(mockExpense);

      await service.remove('uuid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(mockRepo.softRemove).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw NotFoundException when removing non-existent expense', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardRemove', () => {
    it('should permanently remove the expense', async () => {
      mockRepo.findOne.mockResolvedValue(mockExpense);
      mockRepo.remove.mockResolvedValue(mockExpense);

      await service.hardRemove('uuid-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(mockRepo.remove).toHaveBeenCalledWith(mockExpense);
    });

    it('should throw NotFoundException when hard removing non-existent expense', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.hardRemove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
