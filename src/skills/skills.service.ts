import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Skill } from './entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { FilterSkillDto } from './dto/filter-skill.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'name', 'category'] as const;

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    const existing = await this.skillRepository.findOne({
      where: { name: createSkillDto.name },
    });

    if (existing) {
      throw new ConflictException('Skill name already exists');
    }

    const skill = this.skillRepository.create(createSkillDto);
    return this.skillRepository.save(skill);
  }

  async findAll(
    filterDto: FilterSkillDto,
  ): Promise<PaginatedResponseDto<Skill>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
      search,
      category,
      isActive,
      dateFrom,
      dateTo,
    } = filterDto;

    const safeSortBy = validateSortBy(sortBy, ALLOWED_SORT_COLUMNS, 'createdAt');

    const qb = this.skillRepository.createQueryBuilder('skill');

    if (search) {
      qb.andWhere(
        '(unaccent(skill.name) ILIKE unaccent(:search) OR unaccent(skill.description) ILIKE unaccent(:search))',
        { search: `%${search}%` },
      );
    }

    if (category) {
      qb.andWhere('skill.category = :category', { category });
    }

    if (isActive !== undefined) {
      qb.andWhere('skill.isActive = :isActive', { isActive });
    }

    if (dateFrom) {
      qb.andWhere('skill.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('skill.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`skill.${safeSortBy}`, order);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillRepository.findOne({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException(`Skill #${id} not found`);
    }

    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findOne(id);

    if (
      updateSkillDto.name &&
      updateSkillDto.name !== skill.name
    ) {
      const existing = await this.skillRepository.findOne({
        where: { name: updateSkillDto.name },
      });

      if (existing) {
        throw new ConflictException('Skill name already exists');
      }
    }

    Object.assign(skill, updateSkillDto);
    return this.skillRepository.save(skill);
  }

  async remove(id: string): Promise<void> {
    const skill = await this.findOne(id);
    await this.skillRepository.softRemove(skill);
  }

  async hardRemove(id: string): Promise<void> {
    const skill = await this.findOne(id);
    await this.skillRepository.remove(skill);
  }
}
