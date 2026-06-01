import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { PaymentProvider } from './providers/payment-provider.interface';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { CashProvider } from './providers/cash.provider';
import { TransferProvider } from './providers/transfer.provider';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<string, PaymentProvider>;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly mercadopagoProvider: MercadoPagoProvider,
    private readonly cashProvider: CashProvider,
    private readonly transferProvider: TransferProvider,
  ) {
    this.providers = new Map<string, PaymentProvider>([
      ['mercadopago', this.mercadopagoProvider],
      ['cash', this.cashProvider],
      ['transfer', this.transferProvider],
    ]);
  }

  async create(workOrderId: string, dto: CreatePaymentDto): Promise<Payment> {
    const provider = this.getProvider(dto.provider);

    const providerResult = await provider.createPayment(
      dto.amount,
      dto.description || `Pago para orden de trabajo`,
    );

    const payment = this.paymentRepository.create({
      ...dto,
      workOrderId,
      providerPaymentId: providerResult.providerPaymentId,
      status: providerResult.status,
      metadata: providerResult.metadata,
      paidAt:
        providerResult.status === PaymentStatus.APPROVED
          ? new Date()
          : undefined,
    });

    const saved = await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment created: ${saved.id} for work order ${workOrderId}`,
    );

    return saved;
  }

  async findAll(
    workOrderId: string,
    filterDto: FilterPaymentDto,
  ): Promise<PaginatedResponseDto<Payment>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'ASC',
      status,
      method,
      dateFrom,
      dateTo,
    } = filterDto;

    const qb = this.paymentRepository
      .createQueryBuilder('p')
      .where('p.work_order_id = :workOrderId', { workOrderId });

    if (status) {
      qb.andWhere('p.status = :status', { status });
    }

    if (method) {
      qb.andWhere('p.method = :method', { method });
    }

    if (dateFrom) {
      qb.andWhere('p.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('p.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy(`p.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { workOrder: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment #${id} not found`);
    }

    return payment;
  }

  async findOneByWorkOrder(
    workOrderId: string,
    paymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, workOrderId },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment #${paymentId} not found in work order #${workOrderId}`,
      );
    }

    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    if (dto.status === PaymentStatus.APPROVED && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    Object.assign(payment, dto);

    return this.paymentRepository.save(payment);
  }

  async handleMercadoPagoWebhook(body: unknown): Promise<void> {
    const result = await this.mercadopagoProvider.handleWebhook(body);

    if (!result) {
      return;
    }

    const payment = await this.paymentRepository.findOne({
      where: { providerPaymentId: result.providerPaymentId },
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for providerPaymentId: ${result.providerPaymentId}`,
      );
      return;
    }

    payment.status = result.status;

    if (result.metadata) {
      payment.metadata = { ...payment.metadata, ...result.metadata };
    }

    if (result.status === PaymentStatus.APPROVED && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    await this.paymentRepository.save(payment);

    this.logger.log(
      `Payment ${payment.id} updated to status ${result.status} via webhook`,
    );
  }

  private getProvider(providerName: string): PaymentProvider {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new BadRequestException(
        `Unknown payment provider: ${providerName}. Available: ${Array.from(this.providers.keys()).join(', ')}`,
      );
    }

    return provider;
  }
}
