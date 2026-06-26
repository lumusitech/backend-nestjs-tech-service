import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'name', 'email', 'role'] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const { skillIds, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(rest.password, 10);

    const user = this.userRepository.create({
      ...rest,
      password: hashedPassword,
    });

    if (skillIds?.length) {
      user.skills = await this.skillRepository.findBy({ id: In(skillIds) });
    }

    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
      },
    });
  }

  async findAll(filterDto: FilterUserDto): Promise<PaginatedResponseDto<User>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
      role,
    } = filterDto;

    const where = role ? { role } : {};

    const safeSortBy = validateSortBy(sortBy, ALLOWED_SORT_COLUMNS, 'createdAt');
    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { [safeSortBy]: order },
      relations: { skills: true },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { skills: true },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    const { skillIds, ...rest } = updateUserDto;

    if (skillIds !== undefined) {
      user.skills = skillIds.length
        ? await this.skillRepository.findBy({ id: In(skillIds) })
        : [];
    }

    Object.assign(user, rest);

    if (rest.password) {
      user.password = await bcrypt.hash(rest.password, 10);
    }

    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }

  async hardRemove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
