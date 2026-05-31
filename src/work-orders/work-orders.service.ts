import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderNote } from './entities/work-order-note.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { FilterWorkOrderDto } from './dto/filter-work-order.dto';
import { CreateWorkOrderNoteDto } from './dto/create-work-order-note.dto';
import { CreateWorkOrderMaterialDto } from './dto/create-work-order-material.dto';
import { WorkOrderStatus } from '../common/enums/work-order-status.enum';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { User } from '../users/entities/user.entity';

const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.PENDING]: [
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.ASSIGNED]: [
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.IN_PROGRESS]: [
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.DELIVERED],
  [WorkOrderStatus.DELIVERED]: [],
  [WorkOrderStatus.CANCELLED]: [],
};

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderNote)
    private readonly noteRepository: Repository<WorkOrderNote>,
    @InjectRepository(WorkOrderMaterial)
    private readonly materialRepository: Repository<WorkOrderMaterial>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createWorkOrderDto: CreateWorkOrderDto): Promise<WorkOrder> {
    const { technicianIds, ...orderData } = createWorkOrderDto;

    const trackingCode = await this.generateTrackingCode();

    const workOrder = this.workOrderRepository.create({
      ...orderData,
      trackingCode,
    });

    if (technicianIds && technicianIds.length > 0) {
      workOrder.technicians = await this.userRepository.findBy({
        id: In(technicianIds),
      });
    }

    return this.workOrderRepository.save(workOrder);
  }

  async findAll(
    filterDto: FilterWorkOrderDto,
  ): Promise<PaginatedResponseDto<WorkOrder>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
      status,
      priority,
      clientId,
      technicianId,
      serviceTypeId,
      dateFrom,
      dateTo,
    } = filterDto;

    const qb = this.workOrderRepository
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.client', 'client')
      .leftJoinAndSelect('wo.serviceType', 'serviceType')
      .leftJoinAndSelect('wo.technicians', 'technicians');

    if (status) {
      qb.andWhere('wo.status = :status', { status });
    }

    if (priority) {
      qb.andWhere('wo.priority = :priority', { priority });
    }

    if (clientId) {
      qb.andWhere('wo.client_id = :clientId', { clientId });
    }

    if (technicianId) {
      qb.andWhere('technicians.id = :technicianId', { technicianId });
    }

    if (serviceTypeId) {
      qb.andWhere('wo.service_type_id = :serviceTypeId', { serviceTypeId });
    }

    if (dateFrom) {
      qb.andWhere('wo.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('wo.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`wo.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: {
        client: true,
        serviceType: true,
        technicians: true,
        notes: true,
        materials: {
          supplier: true,
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work order #${id} not found`);
    }

    return workOrder;
  }

  async update(
    id: string,
    updateWorkOrderDto: UpdateWorkOrderDto,
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);

    if (
      updateWorkOrderDto.status &&
      updateWorkOrderDto.status !== workOrder.status
    ) {
      this.validateTransition(workOrder.status, updateWorkOrderDto.status);

      if (updateWorkOrderDto.status === WorkOrderStatus.IN_PROGRESS) {
        workOrder.startedAt = new Date();
      }

      if (updateWorkOrderDto.status === WorkOrderStatus.COMPLETED) {
        workOrder.completedAt = new Date();
      }
    }

    const { technicianIds, ...rest } = updateWorkOrderDto;

    Object.assign(workOrder, rest);

    if (technicianIds !== undefined) {
      workOrder.technicians = await this.userRepository.findBy({
        id: In(technicianIds),
      });
    }

    return this.workOrderRepository.save(workOrder);
  }

  async remove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.softRemove(workOrder);
  }

  async hardRemove(id: string): Promise<void> {
    const workOrder = await this.findOne(id);
    await this.workOrderRepository.remove(workOrder);
  }

  async replaceTechnicians(
    id: string,
    technicianIds: string[],
  ): Promise<WorkOrder> {
    const workOrder = await this.findOne(id);
    workOrder.technicians = await this.userRepository.findBy({
      id: In(technicianIds),
    });
    return this.workOrderRepository.save(workOrder);
  }

  // ─── Notes ───────────────────────────────────────────

  async createNote(
    workOrderId: string,
    dto: CreateWorkOrderNoteDto,
  ): Promise<WorkOrderNote> {
    await this.findOne(workOrderId);

    const note = this.noteRepository.create({
      ...dto,
      workOrderId,
    });

    return this.noteRepository.save(note);
  }

  async findNotes(workOrderId: string): Promise<WorkOrderNote[]> {
    await this.findOne(workOrderId);

    return this.noteRepository.find({
      where: { workOrderId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Materials ───────────────────────────────────────

  async createMaterial(
    workOrderId: string,
    dto: CreateWorkOrderMaterialDto,
  ): Promise<WorkOrderMaterial> {
    await this.findOne(workOrderId);

    const material = this.materialRepository.create({
      ...dto,
      workOrderId,
    });

    return this.materialRepository.save(material);
  }

  async findMaterials(workOrderId: string): Promise<WorkOrderMaterial[]> {
    await this.findOne(workOrderId);

    return this.materialRepository.find({
      where: { workOrderId },
      relations: { supplier: true },
      order: { createdAt: 'DESC' },
    });
  }

  async removeMaterial(workOrderId: string, materialId: string): Promise<void> {
    const material = await this.materialRepository.findOne({
      where: { id: materialId, workOrderId },
    });

    if (!material) {
      throw new NotFoundException(
        `Material #${materialId} not found in work order #${workOrderId}`,
      );
    }

    await this.materialRepository.softRemove(material);
  }

  // ─── Private helpers ─────────────────────────────────

  private async generateTrackingCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: WorkOrder | null;

    do {
      let suffix = '';
      for (let i = 0; i < 5; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `TS-${suffix}`;

      exists = await this.workOrderRepository.findOne({
        where: { trackingCode: code },
        withDeleted: true,
      });
    } while (exists);

    return code;
  }

  private validateTransition(
    current: WorkOrderStatus,
    next: WorkOrderStatus,
  ): void {
    const allowed = VALID_TRANSITIONS[current];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} → ${next}`,
      );
    }
  }
}
