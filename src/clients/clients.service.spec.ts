import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createClientDto: CreateClientDto = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      address: '123 Main St',
    };

    it('should create a client successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      const expectedClient = { id: 'uuid-1', ...createClientDto };
      repository.create.mockReturnValue(expectedClient);
      repository.save.mockResolvedValue(expectedClient);

      const result = await service.create(createClientDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createClientDto.email },
      });
      expect(repository.create).toHaveBeenCalledWith(createClientDto);
      expect(repository.save).toHaveBeenCalledWith(expectedClient);
      expect(result).toEqual(expectedClient);
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findOne.mockResolvedValue({
        id: 'existing-uuid',
        email: 'john@example.com',
      });

      await expect(service.create(createClientDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated clients with default params', async () => {
      const clients = [
        { id: 'uuid-1', name: 'John', email: 'john@example.com' },
        { id: 'uuid-2', name: 'Jane', email: 'jane@example.com' },
      ];
      const mockQb = repository.createQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([clients, 2]);

      const filterDto: FilterClientDto = {};
      const result = await service.findAll(filterDto);

      expect(mockQb.orderBy).toHaveBeenCalledWith('client.createdAt', 'ASC');
      expect(mockQb.skip).toHaveBeenCalledWith(0);
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual(clients);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should return paginated clients with custom params', async () => {
      const clients = [
        { id: 'uuid-1', name: 'John', email: 'john@example.com' },
      ];
      const mockQb = repository.createQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([clients, 15]);

      const filterDto: FilterClientDto = {
        page: 2,
        limit: 5,
        sortBy: 'name',
        order: 'DESC',
      };
      const result = await service.findAll(filterDto);

      expect(mockQb.orderBy).toHaveBeenCalledWith('client.name', 'DESC');
      expect(mockQb.skip).toHaveBeenCalledWith(5);
      expect(mockQb.take).toHaveBeenCalledWith(5);
      expect(result.data).toEqual(clients);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should handle empty results', async () => {
      const mockQb = repository.createQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should filter by search term', async () => {
      const clients = [
        { id: 'uuid-1', name: 'Juan Perez', email: 'juan@example.com' },
      ];
      const mockQb = repository.createQueryBuilder();
      mockQb.getManyAndCount.mockResolvedValue([clients, 1]);

      const filterDto: FilterClientDto = { search: 'Juan' };
      const result = await service.findAll(filterDto);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        '(unaccent(client.name) ILIKE unaccent(:search) OR unaccent(client.email) ILIKE unaccent(:search) OR client.phone ILIKE :search)',
        { search: '%Juan%' },
      );
      expect(result.data).toEqual(clients);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      const client = {
        id: 'uuid-1',
        name: 'John',
        email: 'john@example.com',
      };
      repository.findOne.mockResolvedValue(client);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(client);
    });

    it('should throw NotFoundException if client not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingClient = {
      id: 'uuid-1',
      name: 'John',
      email: 'john@example.com',
      phone: '123456789',
      address: '123 Main St',
    };

    it('should update a client successfully', async () => {
      const updateDto: UpdateClientDto = { name: 'John Updated' };
      repository.findOne.mockResolvedValueOnce(existingClient);
      repository.save.mockResolvedValue({ ...existingClient, ...updateDto });

      const result = await service.update('uuid-1', updateDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('John Updated');
    });

    it('should throw NotFoundException if client not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new email already exists', async () => {
      repository.findOne.mockResolvedValueOnce(existingClient);
      repository.findOne.mockResolvedValueOnce({
        id: 'other-uuid',
        email: 'taken@example.com',
      });

      await expect(
        service.update('uuid-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to same email without conflict', async () => {
      repository.findOne.mockResolvedValueOnce(existingClient);
      repository.save.mockResolvedValue(existingClient);

      const result = await service.update('uuid-1', {
        email: 'john@example.com',
      });

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(existingClient);
    });
  });

  describe('remove', () => {
    it('should soft remove a client', async () => {
      const client = { id: 'uuid-1', name: 'John' };
      repository.findOne.mockResolvedValue(client);

      await service.remove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.softRemove).toHaveBeenCalledWith(client);
    });

    it('should throw NotFoundException if client not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.softRemove).not.toHaveBeenCalled();
    });
  });

  describe('hardRemove', () => {
    it('should permanently remove a client', async () => {
      const client = { id: 'uuid-1', name: 'John' };
      repository.findOne.mockResolvedValue(client);

      await service.hardRemove('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.remove).toHaveBeenCalledWith(client);
    });

    it('should throw NotFoundException if client not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.hardRemove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
