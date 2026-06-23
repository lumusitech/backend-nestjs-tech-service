import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { IvaCondition } from './enums/iva-condition.enum';
import { ArcaProvider } from './providers/arca.provider';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { validateSortBy } from '../common/utils/sort-by.util';

const ALLOWED_SORT_COLUMNS = ['createdAt', 'invoiceNumber', 'invoiceType', 'status', 'clientName', 'total'] as const;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly arcaProvider: ArcaProvider,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber(
      dto.invoiceType,
      dto.pointOfSale ?? 1,
    );

    const invoice = this.invoiceRepository.create({
      ...dto,
      invoiceNumber,
      pointOfSale: dto.pointOfSale ?? 1,
      concept: dto.concept ?? undefined,
      clientIvaCondition:
        dto.clientIvaCondition ?? IvaCondition.CONSUMIDOR_FINAL,
      ivaAmount: dto.ivaAmount ?? 0,
      status: InvoiceStatus.DRAFT,
    });

    const saved = await this.invoiceRepository.save(invoice);
    this.logger.log(
      `Invoice draft created: ${saved.invoiceNumber} (${saved.id})`,
    );

    return saved;
  }

  async findAll(
    filterDto: FilterInvoiceDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
      status,
      invoiceType,
      dateFrom,
      dateTo,
      clientName,
    } = filterDto;

    const qb = this.invoiceRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.workOrder', 'workOrder')
      .leftJoinAndSelect('workOrder.client', 'client')
      .leftJoinAndSelect('workOrder.serviceType', 'serviceType');

    if (status) {
      qb.andWhere('i.status = :status', { status });
    }

    if (invoiceType) {
      qb.andWhere('i.invoice_type = :invoiceType', { invoiceType });
    }

    if (dateFrom) {
      qb.andWhere('i.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('i.created_at <= :dateTo', { dateTo });
    }

    if (clientName) {
      qb.andWhere('unaccent(i.client_name) ILIKE unaccent(:clientName)', {
        clientName: `%${clientName}%`,
      });
    }

    const safeSortBy = validateSortBy(sortBy, ALLOWED_SORT_COLUMNS, 'createdAt');
    qb.orderBy(`i.${safeSortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: {
        workOrder: { client: true, serviceType: true },
        payment: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    return invoice;
  }

  async issue(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot issue invoice with status ${invoice.status}. Only DRAFT invoices can be issued.`,
      );
    }

    const issuedAt = new Date();

    const arcaResult = await this.arcaProvider.issueInvoice({
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      pointOfSale: invoice.pointOfSale,
      concept: invoice.concept,
      clientCuit: invoice.clientCuit,
      clientIvaCondition: invoice.clientIvaCondition,
      subtotal: invoice.subtotal,
      ivaAmount: invoice.ivaAmount,
      total: invoice.total,
      issuedAt,
    });

    invoice.status = InvoiceStatus.ISSUED;
    invoice.cae = arcaResult.cae;
    invoice.caeExpiry = arcaResult.caeExpiry;
    invoice.issuedAt = issuedAt;
    invoice.metadata = arcaResult.metadata ?? {};

    const saved = await this.invoiceRepository.save(invoice);
    this.logger.log(
      `Invoice issued: ${saved.invoiceNumber} — CAE: ${saved.cae}`,
    );

    return saved;
  }

  async cancel(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled.');
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot cancel a DRAFT invoice. Delete it instead or issue it first.',
      );
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.cancelledAt = new Date();

    const saved = await this.invoiceRepository.save(invoice);
    this.logger.log(`Invoice cancelled: ${saved.invoiceNumber}`);

    return saved;
  }

  private async generateInvoiceNumber(
    type: string,
    pointOfSale: number,
  ): Promise<string> {
    const pos = String(pointOfSale).padStart(4, '0');

    const lastInvoice = await this.invoiceRepository
      .createQueryBuilder('i')
      .where('i.invoice_type = :type', { type })
      .andWhere('i.point_of_sale = :pos', { pos: pointOfSale })
      .orderBy('i.created_at', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    return `${pos}-${type}-${String(nextNumber).padStart(8, '0')}`;
  }
}
