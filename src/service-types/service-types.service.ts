import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from './entities/service-type.entity';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'name', 'estimatedDuration'] as const;

@Injectable()
export class ServiceTypesService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async create(
    createServiceTypeDto: CreateServiceTypeDto,
  ): Promise<ServiceType> {
    const existing = await this.serviceTypeRepository.findOne({
      where: { name: createServiceTypeDto.name },
    });

    if (existing) {
      throw new ConflictException('Service type name already exists');
    }

    const serviceType = this.serviceTypeRepository.create(createServiceTypeDto);
    return this.serviceTypeRepository.save(serviceType);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ServiceType>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
    } = paginationDto;

    const safeSortBy = validateSortBy(sortBy, ALLOWED_SORT_COLUMNS, 'createdAt');
    const [data, total] = await this.serviceTypeRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { [safeSortBy]: order },
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<ServiceType> {
    const serviceType = await this.serviceTypeRepository.findOne({
      where: { id },
    });

    if (!serviceType) {
      throw new NotFoundException(`Service type #${id} not found`);
    }

    return serviceType;
  }

  async update(
    id: string,
    updateServiceTypeDto: UpdateServiceTypeDto,
  ): Promise<ServiceType> {
    const serviceType = await this.findOne(id);

    if (
      updateServiceTypeDto.name &&
      updateServiceTypeDto.name !== serviceType.name
    ) {
      const existing = await this.serviceTypeRepository.findOne({
        where: { name: updateServiceTypeDto.name },
      });

      if (existing) {
        throw new ConflictException('Service type name already exists');
      }
    }

    Object.assign(serviceType, updateServiceTypeDto);
    return this.serviceTypeRepository.save(serviceType);
  }

  async remove(id: string): Promise<void> {
    const serviceType = await this.findOne(id);
    await this.serviceTypeRepository.softRemove(serviceType);
  }

  async hardRemove(id: string): Promise<void> {
    const serviceType = await this.findOne(id);
    await this.serviceTypeRepository.remove(serviceType);
  }
}
