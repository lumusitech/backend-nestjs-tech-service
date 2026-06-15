import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreference } from './entities/user-preference.entity';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let repo: ReturnType<typeof createMockRepository>;

  const mockPreference: UserPreference = Object.assign(new UserPreference(), {
    id: 'pref-1',
    userId: 'user-1',
    theme: 'light',
    language: 'es',
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    repo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPreferencesService,
        {
          provide: getRepositoryToken(UserPreference),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<UserPreferencesService>(UserPreferencesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByUserId', () => {
    it('should return existing preferences', async () => {
      repo.findOne.mockResolvedValue(mockPreference);

      const result = await service.getByUserId('user-1');

      expect(result).toEqual(mockPreference);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should create default preferences if none exist', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockPreference);
      repo.save.mockResolvedValue(mockPreference);

      const result = await service.getByUserId('user-1');

      expect(repo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        theme: 'light',
        language: 'es',
        preferences: {},
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(mockPreference);
    });
  });

  describe('update', () => {
    it('should update existing preferences', async () => {
      repo.findOne.mockResolvedValue({ ...mockPreference });
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('user-1', {
        theme: 'dark',
        language: 'en',
      });

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('en');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should merge preferences jsonb field', async () => {
      const existing = {
        ...mockPreference,
        preferences: { dashboardLayout: ['a', 'b'] },
      };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('user-1', {
        preferences: { dashboardWidgets: { kpis: true } },
      });

      expect(result.preferences).toEqual({
        dashboardLayout: ['a', 'b'],
        dashboardWidgets: { kpis: true },
      });
    });

    it('should create preference if not exists', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockPreference);
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('user-1', { theme: 'dark' });

      expect(repo.create).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(result).toBeDefined();
    });

    it('should only update provided fields', async () => {
      const existing = {
        ...mockPreference,
        theme: 'light',
        language: 'es',
      };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.update('user-1', { theme: 'dark' });

      expect(result.theme).toBe('dark');
      expect(result.language).toBe('es');
    });
  });
});
