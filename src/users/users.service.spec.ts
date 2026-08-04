import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { UserRole } from './enums/user-role.enum';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;
  let skillRepository: jest.Mocked<Repository<Skill>>;

  const mockUser: User = {
    id: 'uuid-1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    role: UserRole.TECHNICIAN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository<User>(),
        },
        {
          provide: getRepositoryToken(Skill),
          useValue: createMockRepository<Skill>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
    skillRepository = module.get(getRepositoryToken(Skill));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: UserRole.TECHNICIAN,
    };

    it('should create a new user successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword123',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should attach skills when skillIds provided', async () => {
      const skill = { id: 'skill-1', name: 'Redes' } as Skill;
      repository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      repository.create.mockReturnValue({
        ...mockUser,
        skills: [],
      });
      skillRepository.findBy.mockResolvedValue([skill]);
      repository.save.mockResolvedValue(mockUser);

      await service.create({ ...createUserDto, skillIds: ['skill-1'] });

      expect(skillRepository.findBy).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ skills: [skill] }),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('john@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          isActive: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      repository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { createdAt: 'ASC' },
        relations: { skills: true },
      });
      expect(result.data).toEqual(users);
      expect(result.total).toBe(1);
    });

    it('should apply custom pagination and sorting', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 2,
        limit: 5,
        sortBy: 'name',
        order: 'DESC',
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        order: { name: 'DESC' },
        relations: { skills: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        relations: { skills: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      repository.findOne.mockResolvedValueOnce(mockUser);
      repository.save.mockResolvedValue({ ...mockUser, name: 'Updated' });

      const result = await service.update('uuid-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new email already exists', async () => {
      repository.findOne.mockResolvedValueOnce(mockUser);
      repository.findOne.mockResolvedValueOnce({
        ...mockUser,
        id: 'uuid-2',
        email: 'taken@example.com',
      });

      await expect(
        service.update('uuid-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check email conflict if email is unchanged', async () => {
      repository.findOne.mockResolvedValueOnce(mockUser);
      repository.save.mockResolvedValue(mockUser);

      await service.update('uuid-1', { email: mockUser.email });

      expect(repository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should soft remove a user', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await service.remove('uuid-1');

      expect(repository.softRemove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hardRemove', () => {
    it('should hard remove a user', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      await service.hardRemove('uuid-1');

      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.hardRemove('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
