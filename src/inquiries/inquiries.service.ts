import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Inquiry } from './entities/inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { FilterInquiryDto } from './dto/filter-inquiry.dto';
import { ContactInquiryDto } from './dto/contact-inquiry.dto';
import { InquiryStatus } from './enums/inquiry-status.enum';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import {
  InquiryCreatedEvent,
  InquiryAssignedEvent,
  InquiryContactedEvent,
  InquiryReviewedEvent,
} from '../notifications/events/notification.events';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    createDto: CreateInquiryDto,
    createdById: string,
  ): Promise<Inquiry> {
    const inquiry = this.inquiryRepository.create({
      ...createDto,
      createdById,
    });

    const saved = await this.inquiryRepository.save(inquiry);

    const event = new InquiryCreatedEvent();
    event.inquiryId = saved.id;
    event.clientName = saved.clientName;
    event.description = saved.description;
    event.source = saved.source;
    event.assignedToId = saved.assignedToId;
    event.createdById = createdById;
    this.eventEmitter.emit('inquiry.created', event);

    if (saved.assignedToId) {
      const assignedEvent = new InquiryAssignedEvent();
      assignedEvent.inquiryId = saved.id;
      assignedEvent.clientName = saved.clientName;
      assignedEvent.assignedToId = saved.assignedToId;
      assignedEvent.assignedByName = createdById;
      this.eventEmitter.emit('inquiry.assigned', assignedEvent);
    }

    return saved;
  }

  async findAll(
    filterDto: FilterInquiryDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<PaginatedResponseDto<Inquiry>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      status,
      priority,
      source,
      assignedToId,
      dateFrom,
      dateTo,
    } = filterDto;

    const qb = this.inquiryRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.assignedTo', 'assignedTo')
      .leftJoinAndSelect('i.createdBy', 'createdBy');

    if (userRole === UserRole.TECHNICIAN && userId) {
      qb.andWhere('i.assigned_to_id = :userId', { userId });
    }

    if (status) {
      qb.andWhere('i.status = :status', { status });
    }
    if (priority) {
      qb.andWhere('i.priority = :priority', { priority });
    }
    if (source) {
      qb.andWhere('i.source = :source', { source });
    }
    if (assignedToId) {
      qb.andWhere('i.assigned_to_id = :assignedToId', { assignedToId });
    }
    if (dateFrom) {
      qb.andWhere('i.created_at >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      qb.andWhere('i.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`i.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOne({
      where: { id },
      relations: { assignedTo: true, createdBy: true, workOrder: true },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry #${id} not found`);
    }

    return inquiry;
  }

  async update(id: string, updateDto: UpdateInquiryDto): Promise<Inquiry> {
    const inquiry = await this.findOne(id);

    Object.assign(inquiry, updateDto);

    return this.inquiryRepository.save(inquiry);
  }

  async contact(
    id: string,
    contactDto: ContactInquiryDto,
  ): Promise<Inquiry> {
    const inquiry = await this.findOne(id);

    if (inquiry.status !== InquiryStatus.NEW) {
      throw new BadRequestException(
        `Cannot contact inquiry in status "${inquiry.status}". Only "new" inquiries can be contacted.`,
      );
    }

    inquiry.technicianNotes = contactDto.technicianNotes;
    if (contactDto.estimatedCost !== undefined) inquiry.estimatedCost = contactDto.estimatedCost;
    if (contactDto.estimatedDuration !== undefined) inquiry.estimatedDuration = contactDto.estimatedDuration;
    if (contactDto.materialsNeeded !== undefined) inquiry.materialsNeeded = contactDto.materialsNeeded;
    if (contactDto.recommendation !== undefined) inquiry.recommendation = contactDto.recommendation;
    inquiry.status = InquiryStatus.CONTACTED;
    inquiry.contactedAt = new Date();

    const saved = await this.inquiryRepository.save(inquiry);

    const event = new InquiryContactedEvent();
    event.inquiryId = saved.id;
    event.clientName = saved.clientName;
    event.technicianNotes = saved.technicianNotes;
    event.assignedToId = saved.assignedToId;
    this.eventEmitter.emit('inquiry.contacted', event);

    return saved;
  }

  async review(
    id: string,
    updateDto: Pick<UpdateInquiryDto, 'adminDecision' | 'adminNotes'>,
  ): Promise<Inquiry> {
    const inquiry = await this.findOne(id);

    if (inquiry.status !== InquiryStatus.CONTACTED) {
      throw new BadRequestException(
        `Cannot review inquiry in status "${inquiry.status}". Only "contacted" inquiries can be reviewed.`,
      );
    }

    if (updateDto.adminDecision !== undefined) inquiry.adminDecision = updateDto.adminDecision;
    if (updateDto.adminNotes !== undefined) inquiry.adminNotes = updateDto.adminNotes;
    inquiry.status = InquiryStatus.REVIEWED;
    inquiry.reviewedAt = new Date();

    const saved = await this.inquiryRepository.save(inquiry);

    const event = new InquiryReviewedEvent();
    event.inquiryId = saved.id;
    event.clientName = saved.clientName;
    event.adminDecision = saved.adminDecision;
    event.adminNotes = saved.adminNotes;
    this.eventEmitter.emit('inquiry.reviewed', event);

    return saved;
  }

  async convertToWorkOrder(
    id: string,
    clientId: string,
    serviceTypeId: string,
  ): Promise<Inquiry> {
    const inquiry = await this.findOne(id);

    if (inquiry.status !== InquiryStatus.REVIEWED) {
      throw new BadRequestException(
        `Cannot convert inquiry in status "${inquiry.status}". Only "reviewed" inquiries can be converted.`,
      );
    }

    if (inquiry.adminDecision !== 'approved') {
      throw new BadRequestException(
        'Cannot convert an inquiry that was not approved by admin.',
      );
    }

    inquiry.status = InquiryStatus.CONVERTED;
    inquiry.workOrderId = null!;

    const saved = await this.inquiryRepository.save(inquiry);

    return saved;
  }

  async setWorkOrder(id: string, workOrderId: string): Promise<Inquiry> {
    const inquiry = await this.findOne(id);
    inquiry.workOrderId = workOrderId;
    return this.inquiryRepository.save(inquiry);
  }

  async remove(id: string): Promise<void> {
    const inquiry = await this.findOne(id);
    await this.inquiryRepository.softRemove(inquiry);
  }
}
