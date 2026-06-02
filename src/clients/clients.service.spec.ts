import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from './entities/client.entity';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

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
      repository.findAndCount.mockResolvedValue([clients, 2]);

      const paginationDto: PaginationDto = {};
      const result = await service.findAll(paginationDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'ASC' },
      });
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
      repository.findAndCount.mockResolvedValue([clients, 15]);

      const paginationDto: PaginationDto = {
        page: 2,
        limit: 5,
        sortBy: 'name',
        order: 'DESC',
      };
      const result = await service.findAll(paginationDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        order: { name: 'DESC' },
      });
      expect(result.data).toEqual(clients);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should handle empty results', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
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
