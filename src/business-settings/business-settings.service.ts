import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessSetting } from './entities/business-setting.entity';
import { UpdateBusinessSettingDto } from './dto/update-business-settings.dto';

@Injectable()
export class BusinessSettingsService {
  constructor(
    @InjectRepository(BusinessSetting)
    private readonly repository: Repository<BusinessSetting>,
  ) {}

  async get(): Promise<BusinessSetting> {
    let setting = await this.repository.findOne({ where: {} });

    if (!setting) {
      setting = this.repository.create({
        businessName: 'Tech Service',
      });
      await this.repository.save(setting);
    }

    return setting;
  }

  async update(dto: UpdateBusinessSettingDto): Promise<BusinessSetting> {
    let setting = await this.repository.findOne({ where: {} });

    if (!setting) {
      setting = this.repository.create({
        businessName: 'Tech Service',
        ...dto,
      });
    } else {
      Object.assign(setting, dto);
    }

    return this.repository.save(setting);
  }
}
