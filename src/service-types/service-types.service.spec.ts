import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServiceTypesService } from './service-types.service';
import { ServiceType } from './entities/service-type.entity';
import { createMockRepository, createMockQueryBuilder } from '../common/testing/mock-query-builder.helper';

describe('ServiceTypesService', () => {
  let service: ServiceTypesService;
  let repository: ReturnType<typeof createMockRepository>;
  let queryBuilder: ReturnType<typeof createMockQueryBuilder>;

  const mockServiceType: ServiceType = Object.assign(new ServiceType(), {
    id: 'uuid-1',
    name: 'CCTV Installation',
    description: 'Install security cameras',
    estimatedDuration: 120,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();
    repository = createMockRepository({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceTypesService,
        {
          provide: getRepositoryToken(ServiceType),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ServiceTypesService>(ServiceTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a service type when name is unique', async () => {
      const dto = { name: 'CCTV Installation', description: 'Install cameras' };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(dto);
      repository.save.mockResolvedValue(mockServiceType);

      const result = await service.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { name: dto.name },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockServiceType);
    });

    it('should throw ConflictException when name already exists', async () => {
      const dto = { name: 'CCTV Installation' };
      repository.findOne.mockResolvedValue(mockServiceType);

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dto as any)).rejects.toThrow(
        'Service type name already exists',
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated service types with default params', async () => {
      const data = [mockServiceType];
      queryBuilder.getManyAndCount.mockResolvedValue([data, 1]);

      const result = await service.findAll({});

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('serviceType');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('serviceType.createdAt', 'ASC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(data);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should handle custom pagination and sorting', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 2,
        limit: 5,
        sortBy: 'name',
        order: 'DESC',
      });

      expect(queryBuilder.orderBy).toHaveBeenCalledWith('serviceType.name', 'DESC');
      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('should return correct totalPages for multiple pages', async () => {
      const data = Array.from({ length: 3 }, (_, i) => ({
        ...mockServiceType,
        id: `uuid-${i}`,
      }));
      queryBuilder.getManyAndCount.mockResolvedValue([data, 25]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3);
    });

    it('should apply search filter', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: 'CCTV' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%CCTV%' },
      );
    });

    it('should apply isActive filter', async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ isActive: true });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'serviceType.isActive = :isActive',
        { isActive: true },
      );
    });
  });

  describe('findOne', () => {
    it('should return a service type by id', async () => {
      repository.findOne.mockResolvedValue(mockServiceType);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(mockServiceType);
    });

    it('should throw NotFoundException when service type does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Service type #nonexistent not found',
      );
    });
  });

  describe('update', () => {
    it('should update a service type when it exists and name is unchanged', async () => {
      const dto = { description: 'Updated description' };
      repository.findOne.mockResolvedValue(mockServiceType);
      repository.save.mockResolvedValue({ ...mockServiceType, ...dto });

      const result = await service.update('uuid-1', dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
    });

    it('should update name when new name is unique', async () => {
      const dto = { name: 'Electrical Wiring' };
      repository.findOne
        .mockResolvedValueOnce(mockServiceType)
        .mockResolvedValueOnce(null);
      repository.save.mockResolvedValue({ ...mockServiceType, ...dto });

      const result = await service.update('uuid-1', dto);

      expect(result.name).toBe('Electrical Wiring');
    });

    it('should throw ConflictException when updated name already exists', async () => {
      const dto = { name: 'Duplicate Name' };
      const existingWithSameName = {
        ...mockServiceType,
        id: 'uuid-2',
        name: 'Duplicate Name',
      };
      repository.findOne
        .mockResolvedValueOnce(mockServiceType)
        .mockResolvedValueOnce(existingWithSameName);

      await expect(service.update('uuid-1', dto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should not check for duplicate name when name is not in dto', async () => {
      const dto = { description: 'New desc' };
      repository.findOne.mockResolvedValue(mockServiceType);
      repository.save.mockResolvedValue({ ...mockServiceType, ...dto });

      await service.update('uuid-1', dto);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });

    it('should not check for duplicate name when name is the same', async () => {
      const dto = { name: 'CCTV Installation' };
      repository.findOne.mockReset();
      repository.findOne
        .mockResolvedValueOnce(mockServiceType)
        .mockResolvedValue(null);
      repository.save.mockResolvedValue(mockServiceType);

      await service.update('uuid-1', dto);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when service type does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft remove a service type', async () => {
      repository.findOne.mockResolvedValue(mockServiceType);

      await service.remove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.softRemove).toHaveBeenCalledWith(mockServiceType);
    });

    it('should throw NotFoundException when service type does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardRemove', () => {
    it('should permanently remove a service type', async () => {
      repository.findOne.mockResolvedValue(mockServiceType);

      await service.hardRemove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.remove).toHaveBeenCalledWith(mockServiceType);
    });

    it('should throw NotFoundException when service type does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.hardRemove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
