import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'name', 'contact', 'email'] as const;

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    if (createSupplierDto.email) {
      const existing = await this.supplierRepository.findOne({
        where: { email: createSupplierDto.email },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    const supplier = this.supplierRepository.create(createSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(
    filterDto: FilterSupplierDto,
  ): Promise<PaginatedResponseDto<Supplier>> {
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

    const qb = this.supplierRepository.createQueryBuilder('supplier');

    if (search) {
      qb.andWhere(
        `(unaccent(supplier.name) ILIKE unaccent(:search)
          OR unaccent(supplier.contact) ILIKE unaccent(:search)
          OR supplier.phone ILIKE :search
          OR unaccent(supplier.email) ILIKE unaccent(:search)
          OR unaccent(supplier.address) ILIKE unaccent(:search)
          OR unaccent(supplier.notes) ILIKE unaccent(:search))`,
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      qb.andWhere('supplier.isActive = :isActive', { isActive });
    }

    if (dateFrom) {
      qb.andWhere('supplier.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('supplier.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`supplier.${safeSortBy}`, order);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });

    if (!supplier) {
      throw new NotFoundException(`Supplier #${id} not found`);
    }

    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existing = await this.supplierRepository.findOne({
        where: { email: updateSupplierDto.email },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(supplier, updateSupplierDto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.softRemove(supplier);
  }

  async hardRemove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.remove(supplier);
  }
}
