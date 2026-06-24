import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { Supplier } from './entities/supplier.entity';
import { createMockRepository, createMockQueryBuilder } from '../common/testing/mock-query-builder.helper';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: ReturnType<typeof createMockRepository>;
  let queryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();
    repository = createMockRepository({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSupplierDto: CreateSupplierDto = {
      name: 'Acme Supplies',
      contact: 'Jane Doe',
      phone: '123456789',
      address: '456 Market St',
      email: 'acme@example.com',
    };

    it('should create a supplier successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      const expectedSupplier = { id: 'uuid-1', ...createSupplierDto };
      repository.create.mockReturnValue(expectedSupplier);
      repository.save.mockResolvedValue(expectedSupplier);

      const result = await service.create(createSupplierDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createSupplierDto.email },
      });
      expect(repository.create).toHaveBeenCalledWith(createSupplierDto);
      expect(repository.save).toHaveBeenCalledWith(expectedSupplier);
      expect(result).toEqual(expectedSupplier);
    });

    it('should create a supplier without email', async () => {
      const dtoNoEmail: CreateSupplierDto = {
        name: 'Acme Supplies',
        contact: 'Jane Doe',
        phone: '123456789',
        address: '456 Market St',
      };
      const expectedSupplier = { id: 'uuid-1', ...dtoNoEmail };
      repository.create.mockReturnValue(expectedSupplier);
      repository.save.mockResolvedValue(expectedSupplier);

      const result = await service.create(dtoNoEmail);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(dtoNoEmail);
      expect(result).toEqual(expectedSupplier);
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findOne.mockResolvedValue({
        id: 'existing-uuid',
        email: 'acme@example.com',
      });

      await expect(service.create(createSupplierDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated suppliers with default params', async () => {
      const suppliers = [
        { id: 'uuid-1', name: 'Acme', email: 'acme@example.com' },
        { id: 'uuid-2', name: 'Globex', email: 'globex@example.com' },
      ];
      queryBuilder.getManyAndCount.mockResolvedValue([suppliers, 2]);

      const result = await service.findAll({});

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('supplier');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('supplier.createdAt', 'ASC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(suppliers);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should return paginated suppliers with custom params', async () => {
      const suppliers = [
        { id: 'uuid-1', name: 'Acme', email: 'acme@example.com' },
      ];
      queryBuilder.getManyAndCount.mockResolvedValue([suppliers, 20]);

      const result = await service.findAll({
        page: 3,
        limit: 5,
        sortBy: 'name',
        order: 'DESC',
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('supplier.name', 'DESC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.data).toEqual(suppliers);
      expect(result.total).toBe(20);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(4);
    });

    it('should apply search filter', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'Acme' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%Acme%' },
      );
    });

    it('should apply isActive filter', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: true });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'supplier.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should handle empty results', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      const supplier = {
        id: 'uuid-1',
        name: 'Acme',
        email: 'acme@example.com',
      };
      repository.findOne.mockResolvedValue(supplier);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(supplier);
    });

    it('should throw NotFoundException if supplier not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingSupplier = {
      id: 'uuid-1',
      name: 'Acme',
      contact: 'Jane',
      phone: '123456789',
      address: '456 Market St',
      email: 'acme@example.com',
    };

    it('should update a supplier successfully', async () => {
      const updateDto: UpdateSupplierDto = { name: 'Acme Updated' };
      repository.findOne.mockResolvedValueOnce(existingSupplier);
      repository.save.mockResolvedValue({ ...existingSupplier, ...updateDto });

      const result = await service.update('uuid-1', updateDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Acme Updated');
    });

    it('should throw NotFoundException if supplier not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new email already exists', async () => {
      repository.findOne.mockResolvedValueOnce(existingSupplier);
      repository.findOne.mockResolvedValueOnce({
        id: 'other-uuid',
        email: 'taken@example.com',
      });

      await expect(
        service.update('uuid-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email without conflict', async () => {
      repository.findOne.mockResolvedValueOnce(existingSupplier);
      repository.save.mockResolvedValue(existingSupplier);

      const result = await service.update('uuid-1', {
        email: 'acme@example.com',
      });

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(existingSupplier);
    });
  });

  describe('remove', () => {
    it('should soft remove a supplier', async () => {
      const supplier = { id: 'uuid-1', name: 'Acme' };
      repository.findOne.mockResolvedValue(supplier);

      await service.remove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.softRemove).toHaveBeenCalledWith(supplier);
    });

    it('should throw NotFoundException if supplier not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('hardRemove', () => {
    it('should permanently remove a supplier', async () => {
      const supplier = { id: 'uuid-1', name: 'Acme' };
      repository.findOne.mockResolvedValue(supplier);

      await service.hardRemove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.remove).toHaveBeenCalledWith(supplier);
    });

    it('should throw NotFoundException if supplier not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.hardRemove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
