import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'name', 'email', 'phone', 'address'] as const;

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existing = await this.clientRepository.findOne({
      where: { email: createClientDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  async findAll(
    filterDto: FilterClientDto,
  ): Promise<PaginatedResponseDto<Client>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
      search,
      isActive,
      dateFrom,
      dateTo,
    } = filterDto;

    const safeSortBy = validateSortBy(sortBy, ALLOWED_SORT_COLUMNS, 'createdAt');

    const qb = this.clientRepository.createQueryBuilder('client');

    if (search) {
      qb.andWhere(
        `(unaccent(client.name) ILIKE unaccent(:search)
          OR unaccent(client.email) ILIKE unaccent(:search)
          OR client.phone ILIKE :search
          OR unaccent(client.address) ILIKE unaccent(:search)
          OR client.cuit ILIKE :search
          OR unaccent(client.internet_provider) ILIKE unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      qb.andWhere('client.is_active = :isActive', { isActive });
    }

    if (dateFrom) {
      qb.andWhere('client.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('client.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`client.${safeSortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client #${id} not found`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    if (updateClientDto.email && updateClientDto.email !== client.email) {
      const existing = await this.clientRepository.findOne({
        where: { email: updateClientDto.email },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.softRemove(client);
  }

  async hardRemove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }
}
