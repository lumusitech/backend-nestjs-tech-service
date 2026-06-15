import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from './entities/user-preference.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferenceRepository: Repository<UserPreference>,
  ) {}

  async getByUserId(userId: string): Promise<UserPreference> {
    let pref = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!pref) {
      pref = this.preferenceRepository.create({
        userId,
        theme: 'light',
        language: 'es',
        preferences: {},
      });
      pref = await this.preferenceRepository.save(pref);
    }

    return pref;
  }

  async update(
    userId: string,
    dto: UpdatePreferenceDto,
  ): Promise<UserPreference> {
    let pref = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!pref) {
      pref = this.preferenceRepository.create({ userId });
    }

    if (dto.theme !== undefined) {
      pref.theme = dto.theme;
    }

    if (dto.language !== undefined) {
      pref.language = dto.language;
    }

    if (dto.preferences !== undefined) {
      pref.preferences = { ...(pref.preferences || {}), ...dto.preferences };
    }

    return this.preferenceRepository.save(pref);
  }
}
