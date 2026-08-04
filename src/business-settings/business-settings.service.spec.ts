import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessSettingsService } from './business-settings.service';
import { BusinessSetting } from './entities/business-setting.entity';
import { createMockRepository } from '../common/testing/mock-query-builder.helper';

describe('BusinessSettingsService', () => {
  let service: BusinessSettingsService;
  let repo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessSettingsService,
        { provide: getRepositoryToken(BusinessSetting), useValue: repo },
      ],
    }).compile();

    service = module.get<BusinessSettingsService>(BusinessSettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return existing setting', async () => {
      const setting = {
        businessName: 'My Shop',
        primaryColor: '#000',
      } as BusinessSetting;
      repo.findOne.mockResolvedValue(setting);

      const result = await service.get();

      expect(result).toEqual(setting);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should create and save defaults when none exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = { businessName: 'Tech Service' } as BusinessSetting;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.get();

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ businessName: 'Tech Service' }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('should fall back to defaults on repository error', async () => {
      repo.findOne.mockRejectedValue(new Error('table missing'));
      repo.create.mockReturnValue({
        businessName: 'Tech Service',
      });

      const result = await service.get();

      expect(result).toEqual(
        expect.objectContaining({ businessName: 'Tech Service' }),
      );
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      const setting = {
        businessName: 'Old',
        primaryColor: '#000',
      } as BusinessSetting;
      repo.findOne.mockResolvedValue(setting);
      repo.save.mockResolvedValue({ ...setting, businessName: 'New' });

      const result = await service.update({ businessName: 'New' });

      expect(repo.save).toHaveBeenCalled();
      expect(result.businessName).toBe('New');
    });

    it('should create setting with defaults when none exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = {
        businessName: 'Custom',
        primaryColor: '#3B82F6',
      } as BusinessSetting;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.update({ businessName: 'Custom' });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ businessName: 'Custom' }),
      );
      expect(result.businessName).toBe('Custom');
    });
  });
});
