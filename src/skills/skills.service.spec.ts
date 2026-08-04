import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { Skill } from './entities/skill.entity';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../common/testing/mock-query-builder.helper';

describe('SkillsService', () => {
  let service: SkillsService;
  let repo: ReturnType<typeof createMockRepository>;

  const mockSkill: Skill = {
    id: 'skill-1',
    name: 'Redes',
    category: 'Networking',
    description: 'Configuración de redes',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    repo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: getRepositoryToken(Skill), useValue: repo },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a skill', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockSkill);
      repo.save.mockResolvedValue(mockSkill);

      const result = await service.create({
        name: 'Redes',
        category: 'Networking',
        description: 'Configuración de redes',
      });

      expect(repo.create).toHaveBeenCalled();
      expect(result).toEqual(mockSkill);
    });

    it('should throw ConflictException if name exists', async () => {
      repo.findOne.mockResolvedValue(mockSkill);

      await expect(service.create({ name: 'Redes' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated skills', async () => {
      const qb = createMockQueryBuilder([mockSkill], 1);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual([mockSkill]);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ search: 'redes' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        { search: '%redes%' },
      );
    });

    it('should apply isActive filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ isActive: false });

      expect(qb.andWhere).toHaveBeenCalledWith('skill.isActive = :isActive', {
        isActive: false,
      });
    });

    it('should apply dateTo filter with next-day boundary', async () => {
      const qb = createMockQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ dateTo: '2026-12-31' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'skill.created_at < :dateToEnd',
        { dateToEnd: '2027-01-01' },
      );
    });

    it('should apply dateFrom filter', async () => {
      const qb = createMockQueryBuilder([], 0);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ dateFrom: '2026-01-01' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'skill.created_at >= :dateFrom',
        { dateFrom: '2026-01-01' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a skill by id', async () => {
      repo.findOne.mockResolvedValue(mockSkill);

      const result = await service.findOne('skill-1');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
      });
      expect(result).toEqual(mockSkill);
    });

    it('should throw NotFoundException if not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a skill', async () => {
      repo.findOne.mockResolvedValueOnce(mockSkill);
      repo.save.mockResolvedValue({ ...mockSkill, name: 'Updated' });

      const result = await service.update('skill-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw ConflictException on name collision', async () => {
      repo.findOne.mockResolvedValueOnce(mockSkill);
      repo.findOne.mockResolvedValueOnce({ ...mockSkill, id: 'other' });

      await expect(
        service.update('skill-1', { name: 'Taken' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft remove a skill', async () => {
      repo.findOne.mockResolvedValue(mockSkill);

      await service.remove('skill-1');

      expect(repo.softRemove).toHaveBeenCalledWith(mockSkill);
    });

    it('should hard remove a skill', async () => {
      repo.findOne.mockResolvedValue(mockSkill);

      await service.hardRemove('skill-1');

      expect(repo.remove).toHaveBeenCalledWith(mockSkill);
    });
  });
});
