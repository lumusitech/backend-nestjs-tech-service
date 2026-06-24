import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSetting } from './entities/business-setting.entity';
import { UpdateBusinessSettingDto } from './dto/update-business-settings.dto';

@Injectable()
export class BusinessSettingsService {
  private readonly logger = new Logger(BusinessSettingsService.name);

  private readonly defaults: Partial<BusinessSetting> = {
    businessName: 'Tech Service',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
  };

  constructor(
    @InjectRepository(BusinessSetting)
    private readonly repository: Repository<BusinessSetting>,
  ) {}

  async get(): Promise<BusinessSetting> {
    try {
      let setting = await this.repository.findOne({ where: {} });

      if (!setting) {
        setting = this.repository.create(this.defaults);
        await this.repository.save(setting);
      }

      return setting;
    } catch (error) {
      this.logger.warn('business_settings table not found, returning defaults');
      return this.repository.create(this.defaults);
    }
  }

  async update(dto: UpdateBusinessSettingDto): Promise<BusinessSetting> {
    try {
      let setting = await this.repository.findOne({ where: {} });

      if (!setting) {
        setting = this.repository.create({
          ...this.defaults,
          ...dto,
        });
      } else {
        Object.assign(setting, dto);
      }

      return this.repository.save(setting);
    } catch (error) {
      this.logger.warn('business_settings table not found, returning provided values');
      return this.repository.create({ ...this.defaults, ...dto });
    }
  }
}
