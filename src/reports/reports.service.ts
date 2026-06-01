import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { WorkOrderMaterial } from '../work-orders/entities/work-order-material.entity';
import { Expense } from '../finances/entities/expense.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { WorkOrderStatus } from '../common/enums/work-order-status.enum';
import { PeriodFilterDto } from './dto/period-filter.dto';
import { IncomeReportDto, PeriodLabelDto } from './dto/income-report.dto';
import { ExpenseReportDto } from './dto/expense-report.dto';
import { ProfitReportDto } from './dto/profit-report.dto';
import { SummaryReportDto } from './dto/summary-report.dto';
import { ClientReportDto } from './dto/client-report.dto';
import { BudgetReportDto } from './dto/budget-report.dto';
import { ReceiptReportDto } from './dto/budget-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderMaterial)
    private readonly materialRepository: Repository<WorkOrderMaterial>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async getSummary(): Promise<SummaryReportDto> {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      kpis,
      monthlyTrend,
      workOrdersByStatus,
      topServices,
      paymentMethodDistribution,
      topClients,
      technicianPerformance,
      workOrdersByPriority,
      trends,
    ] = await Promise.all([
      this.getKpis(),
      this.getMonthlyTrend(sixMonthsAgo, now),
      this.getWorkOrdersByStatus(),
      this.getTopServices(sixMonthsAgo, now),
      this.getPaymentMethodDistribution(sixMonthsAgo, now),
      this.getTopClients(),
      this.getTechnicianPerformance(),
      this.getWorkOrdersByPriority(),
      this.getTrends(),
    ]);

    return {
      kpis,
      monthlyTrend,
      workOrdersByStatus,
      topServices,
      paymentMethodDistribution,
      topClients,
      technicianPerformance,
      workOrdersByPriority,
      trends,
    };
  }

  async getIncome(filter: PeriodFilterDto): Promise<IncomeReportDto> {
    const { from, to, label } = this.resolvePeriod(filter);

    const rows: { total: string; count: string }[] =
      await this.paymentRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .addSelect('COUNT(*)', 'count')
        .where('p.status = :status', { status: PaymentStatus.APPROVED })
        .andWhere('p.created_at >= :from', { from })
        .andWhere('p.created_at <= :to', { to })
        .getRawMany();

    const totalIncome = Number(rows[0]?.total ?? 0);
    const paymentCount = Number(rows[0]?.count ?? 0);
    const averageTicket = paymentCount > 0 ? totalIncome / paymentCount : 0;

    const byMethod: {
      method: string;
      total: string;
      count: string;
    }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('p.method', 'method')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .andWhere('p.created_at >= :from', { from })
      .andWhere('p.created_at <= :to', { to })
      .groupBy('p.method')
      .getRawMany();

    const methodLabels: Record<string, string> = {
      credit_card: 'Tarjeta de crédito',
      debit_card: 'Tarjeta de débito',
      cash: 'Efectivo',
      transfer: 'Transferencia',
    };

    const byMethodResult = byMethod.map((r) => ({
      method: r.method,
      label: methodLabels[r.method] || r.method,
      total: Number(r.total),
      count: Number(r.count),
      percentage: totalIncome > 0 ? (Number(r.total) / totalIncome) * 100 : 0,
    }));

    const byDay: { date: string; total: string }[] =
      await this.paymentRepository
        .createQueryBuilder('p')
        .select("TO_CHAR(p.created_at, 'YYYY-MM-DD')", 'date')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: PaymentStatus.APPROVED })
        .andWhere('p.created_at >= :from', { from })
        .andWhere('p.created_at <= :to', { to })
        .groupBy("TO_CHAR(p.created_at, 'YYYY-MM-DD')")
        .orderBy("TO_CHAR(p.created_at, 'YYYY-MM-DD')", 'ASC')
        .getRawMany();

    const prevPeriod = this.getPreviousPeriod(from, to);
    const prevRows: { total: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .andWhere('p.created_at >= :from', { from: prevPeriod.from })
      .andWhere('p.created_at <= :to', { to: prevPeriod.to })
      .getRawMany();

    const previousPeriodTotal = Number(prevRows[0]?.total ?? 0);
    const changePercentage =
      previousPeriodTotal > 0
        ? ((totalIncome - previousPeriodTotal) / previousPeriodTotal) * 100
        : 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString(), label },
      totalIncome,
      paymentCount,
      averageTicket,
      byMethod: byMethodResult,
      byDay: byDay.map((r) => ({ date: r.date, total: Number(r.total) })),
      previousPeriodTotal,
      changePercentage: Math.round(changePercentage * 100) / 100,
    };
  }

  async getExpenses(filter: PeriodFilterDto): Promise<ExpenseReportDto> {
    const { from, to, label } = this.resolvePeriod(filter);

    const categoryLabels: Record<string, string> = {
      rent: 'Alquiler',
      utilities: 'Servicios',
      salaries: 'Sueldos',
      tools: 'Herramientas',
      transport: 'Transporte',
      advertising: 'Publicidad',
      supplies: 'Insumos',
      maintenance: 'Mantenimiento',
      hosting: 'Hosting/Dominio',
      other: 'Otros',
    };

    const qb = this.expenseRepository
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('e.date >= :from', { from: from.toISOString().split('T')[0] })
      .andWhere('e.date <= :to', { to: to.toISOString().split('T')[0] })
      .groupBy('e.category');

    if (filter.category) {
      qb.andWhere('e.category = :category', {
        category: filter.category,
      });
    }

    const rows: { category: string; total: string; count: string }[] =
      await qb.getRawMany();

    const totalExpenses = rows.reduce((s, r) => s + Number(r.total), 0);

    const byCategory = rows.map((r) => ({
      category: r.category,
      label: categoryLabels[r.category] || r.category,
      total: Number(r.total),
      count: Number(r.count),
      percentage:
        totalExpenses > 0 ? (Number(r.total) / totalExpenses) * 100 : 0,
    }));

    const prevPeriod = this.getPreviousPeriod(from, to);
    const prevRows: { total: string }[] = await this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.date >= :from', {
        from: prevPeriod.from.toISOString().split('T')[0],
      })
      .andWhere('e.date <= :to', {
        to: prevPeriod.to.toISOString().split('T')[0],
      })
      .getRawMany();

    const previousPeriodTotal = Number(prevRows[0]?.total ?? 0);
    const changePercentage =
      previousPeriodTotal > 0
        ? ((totalExpenses - previousPeriodTotal) / previousPeriodTotal) * 100
        : 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString(), label },
      totalExpenses,
      byCategory,
      previousPeriodTotal,
      changePercentage: Math.round(changePercentage * 100) / 100,
    };
  }

  async getProfit(filter: PeriodFilterDto): Promise<ProfitReportDto> {
    const { from, to, label } = this.resolvePeriod(filter);

    const incomeRows: { total: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .andWhere('p.created_at >= :from', { from })
      .andWhere('p.created_at <= :to', { to })
      .getRawMany();

    const materialRows: { total: string }[] = await this.materialRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'total')
      .innerJoin('m.workOrder', 'wo')
      .where('wo.created_at >= :from', { from })
      .andWhere('wo.created_at <= :to', { to })
      .getRawMany();

    const expenseRows: { total: string }[] = await this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.date >= :from', { from: from.toISOString().split('T')[0] })
      .andWhere('e.date <= :to', { to: to.toISOString().split('T')[0] })
      .getRawMany();

    const woCountRows: { count: string }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('COUNT(*)', 'count')
      .where('wo.created_at >= :from', { from })
      .andWhere('wo.created_at <= :to', { to })
      .getRawMany();

    const income = Number(incomeRows[0]?.total ?? 0);
    const materialCosts = Number(materialRows[0]?.total ?? 0);
    const operationalExpenses = Number(expenseRows[0]?.total ?? 0);
    const grossProfit = income - materialCosts;
    const netProfit = grossProfit - operationalExpenses;
    const workOrderCount = Number(woCountRows[0]?.count ?? 0);

    const prevPeriod = this.getPreviousPeriod(from, to);
    const prevIncomeRows: { total: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .andWhere('p.created_at >= :from', { from: prevPeriod.from })
      .andWhere('p.created_at <= :to', { to: prevPeriod.to })
      .getRawMany();

    const prevMaterialRows: { total: string }[] = await this.materialRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'total')
      .innerJoin('m.workOrder', 'wo')
      .where('wo.created_at >= :from', { from: prevPeriod.from })
      .andWhere('wo.created_at <= :to', { to: prevPeriod.to })
      .getRawMany();

    const prevExpenseRows: { total: string }[] = await this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.date >= :from', {
        from: prevPeriod.from.toISOString().split('T')[0],
      })
      .andWhere('e.date <= :to', {
        to: prevPeriod.to.toISOString().split('T')[0],
      })
      .getRawMany();

    const prevNetProfit =
      Number(prevIncomeRows[0]?.total ?? 0) -
      Number(prevMaterialRows[0]?.total ?? 0) -
      Number(prevExpenseRows[0]?.total ?? 0);

    const changePercentage =
      prevNetProfit !== 0
        ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100
        : 0;

    return {
      period: { from: from.toISOString(), to: to.toISOString(), label },
      income,
      materialCosts,
      operationalExpenses,
      grossProfit,
      netProfit,
      workOrderCount,
      previousPeriodNetProfit: prevNetProfit,
      changePercentage: Math.round(changePercentage * 100) / 100,
    };
  }

  async getServices(filter: PeriodFilterDto): Promise<{
    period: PeriodLabelDto;
    services: { name: string; count: number; revenue: number }[];
  }> {
    const { from, to, label } = this.resolvePeriod(filter);

    const rows: { name: string; count: string; revenue: string }[] =
      await this.workOrderRepository
        .createQueryBuilder('wo')
        .innerJoin('wo.serviceType', 'st')
        .leftJoin('wo.payments', 'p', 'p.status = :pStatus', {
          pStatus: PaymentStatus.APPROVED,
        })
        .select('st.name', 'name')
        .addSelect('COUNT(DISTINCT wo.id)', 'count')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
        .where('wo.created_at >= :from', { from })
        .andWhere('wo.created_at <= :to', { to })
        .groupBy('st.name')
        .orderBy('COUNT(DISTINCT wo.id)', 'DESC')
        .getRawMany();

    return {
      period: { from: from.toISOString(), to: to.toISOString(), label },
      services: rows.map((r) => ({
        name: r.name,
        count: Number(r.count),
        revenue: Number(r.revenue),
      })),
    };
  }

  async getTechnicianRanking(): Promise<
    {
      technicianId: string;
      name: string;
      completedOrders: number;
      averageResolutionDays: number;
      totalRevenue: number;
    }[]
  > {
    const rows: {
      id: string;
      name: string;
      completed: string;
      avg_days: string;
      revenue: string;
    }[] = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('work_order_technicians', 'wot', 'wot.user_id = u.id')
      .innerJoin(
        'work_orders',
        'wo',
        'wo.id = wot.work_order_id AND wo.status = :completed',
        { completed: WorkOrderStatus.COMPLETED },
      )
      .leftJoin(
        'payments',
        'p',
        'p.work_order_id = wo.id AND p.status = :pStatus',
        { pStatus: PaymentStatus.APPROVED },
      )
      .select('u.id', 'id')
      .addSelect('u.name', 'name')
      .addSelect('COUNT(DISTINCT wo.id)', 'completed')
      .addSelect(
        'COALESCE(AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 86400), 0)',
        'avg_days',
      )
      .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
      .where('u.role = :role', { role: UserRole.TECHNICIAN })
      .groupBy('u.id')
      .addGroupBy('u.name')
      .orderBy('COUNT(DISTINCT wo.id)', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      technicianId: r.id,
      name: r.name,
      completedOrders: Number(r.completed),
      averageResolutionDays: Math.round(Number(r.avg_days) * 10) / 10,
      totalRevenue: Number(r.revenue),
    }));
  }

  async getTechnicianDetail(id: string): Promise<{
    technicianId: string;
    name: string;
    completedOrders: number;
    inProgressOrders: number;
    averageResolutionDays: number;
    totalRevenue: number;
    recentOrders: {
      trackingCode: string;
      serviceTypeName: string;
      status: string;
      completedAt: Date | null;
    }[];
  }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Technician #${id} not found`);
    }

    const stats: {
      completed: string;
      in_progress: string;
      avg_days: string;
      revenue: string;
    }[] = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('work_order_technicians', 'wot', 'wot.user_id = u.id')
      .innerJoin('work_orders', 'wo', 'wo.id = wot.work_order_id')
      .leftJoin(
        'payments',
        'p',
        'p.work_order_id = wo.id AND p.status = :pStatus',
        { pStatus: PaymentStatus.APPROVED },
      )
      .select(
        "COUNT(DISTINCT CASE WHEN wo.status = 'completed' THEN wo.id END)",
        'completed',
      )
      .addSelect(
        "COUNT(DISTINCT CASE WHEN wo.status = 'in_progress' THEN wo.id END)",
        'in_progress',
      )
      .addSelect(
        "COALESCE(AVG(CASE WHEN wo.status = 'completed' THEN EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 86400 END), 0)",
        'avg_days',
      )
      .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
      .where('u.id = :id', { id })
      .getRawMany();

    const recentOrders: {
      tracking_code: string;
      service_name: string;
      status: string;
      completed_at: Date | null;
    }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .innerJoin('wo.technicians', 't')
      .innerJoin('wo.serviceType', 'st')
      .select('wo.tracking_code', 'tracking_code')
      .addSelect('st.name', 'service_name')
      .addSelect('wo.status', 'status')
      .addSelect('wo.completed_at', 'completed_at')
      .where('t.id = :id', { id })
      .orderBy('wo.created_at', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      technicianId: id,
      name: user.name,
      completedOrders: Number(stats[0]?.completed ?? 0),
      inProgressOrders: Number(stats[0]?.in_progress ?? 0),
      averageResolutionDays:
        Math.round(Number(stats[0]?.avg_days ?? 0) * 10) / 10,
      totalRevenue: Number(stats[0]?.revenue ?? 0),
      recentOrders: recentOrders.map((r) => ({
        trackingCode: r.tracking_code,
        serviceTypeName: r.service_name,
        status: r.status,
        completedAt: r.completed_at,
      })),
    };
  }

  async getClientReport(clientId: string): Promise<ClientReportDto> {
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client #${clientId} not found`);
    }

    const workOrders = await this.workOrderRepository.find({
      where: { clientId },
      relations: { serviceType: true, payments: true, materials: true },
      order: { createdAt: 'DESC' },
    });

    const allPayments = workOrders.flatMap((wo) => wo.payments);
    const approvedPayments = allPayments.filter(
      (p) => p.status === PaymentStatus.APPROVED,
    );
    const pendingPayments = allPayments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    );

    const totalSpent = approvedPayments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );
    const outstandingDebt = pendingPayments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );
    const completedOrders = workOrders.filter(
      (wo) =>
        wo.status === WorkOrderStatus.COMPLETED ||
        wo.status === WorkOrderStatus.DELIVERED,
    );
    const averageTicket =
      completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;

    const clientWorkOrders = workOrders.map((wo) => {
      const woApproved = wo.payments
        .filter((p) => p.status === PaymentStatus.APPROVED)
        .reduce((s, p) => s + Number(p.amount), 0);
      const woPending = wo.payments
        .filter((p) => p.status === PaymentStatus.PENDING)
        .reduce((s, p) => s + Number(p.amount), 0);
      const materialsCost = wo.materials.reduce(
        (s, m) => s + Number(m.quantity) * Number(m.unitCost),
        0,
      );

      return {
        id: wo.id,
        trackingCode: wo.trackingCode,
        status: wo.status,
        serviceTypeName: wo.serviceType.name,
        createdAt: wo.createdAt,
        completedAt: wo.completedAt,
        totalPaid: woApproved,
        pendingAmount: woPending,
        materialsCost,
      };
    });

    const paymentHistory = allPayments
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map((p) => {
        const wo = workOrders.find((w) => w.id === p.workOrderId);
        return {
          id: p.id,
          amount: Number(p.amount),
          method: p.method,
          status: p.status,
          paidAt: p.paidAt,
          trackingCode: wo?.trackingCode ?? '',
        };
      });

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
      },
      kpis: {
        totalWorkOrders: workOrders.length,
        completedOrders: completedOrders.length,
        totalSpent,
        outstandingDebt,
        averageTicket: Math.round(averageTicket * 100) / 100,
        lastServiceDate:
          completedOrders.length > 0 ? completedOrders[0].completedAt : null,
        isRecurrent: workOrders.length >= 3,
      },
      workOrders: clientWorkOrders,
      paymentHistory,
    };
  }

  async getBudgetData(workOrderId: string): Promise<BudgetReportDto> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId },
      relations: { client: true, serviceType: true, materials: true },
    });
    if (!workOrder) {
      throw new NotFoundException(`Work order #${workOrderId} not found`);
    }

    const materials = workOrder.materials.map((m) => ({
      description: m.description,
      quantity: Number(m.quantity),
      unitPrice: Number(m.unitCost),
      subtotal: Number(m.quantity) * Number(m.unitCost),
    }));

    const materialsTotal = materials.reduce((s, i) => s + i.subtotal, 0);
    const budgetCountRows: { count: string }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('COUNT(*)', 'count')
      .getRawMany();
    const budgetNumber = `BUD-${String(Number(budgetCountRows[0]?.count ?? 0) + 1).padStart(5, '0')}`;

    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setDate(validUntil.getDate() + 30);

    return {
      budgetNumber,
      date: now,
      validUntil,
      businessInfo: {
        name: this.configService.get<string>('BUSINESS_NAME', 'Tech Service'),
        address: this.configService.get<string>(
          'BUSINESS_ADDRESS',
          'Dirección no configurada',
        ),
        phone: this.configService.get<string>('BUSINESS_PHONE', ''),
        email: this.configService.get<string>('BUSINESS_EMAIL', ''),
      },
      client: {
        name: workOrder.client.name,
        email: workOrder.client.email,
        phone: workOrder.client.phone,
        address: workOrder.client.address,
      },
      workOrder: {
        trackingCode: workOrder.trackingCode,
        serviceTypeName: workOrder.serviceType.name,
        diagnosis: workOrder.diagnosis,
        scheduledDate: workOrder.scheduledDate,
      },
      items: materials,
      laborCost: 0,
      subtotal: materialsTotal,
      total: materialsTotal,
      notes: '',
    };
  }

  async getReceiptData(paymentId: string): Promise<ReceiptReportDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: { workOrder: { client: true, serviceType: true } },
    });
    if (!payment) {
      throw new NotFoundException(`Payment #${paymentId} not found`);
    }

    const receiptCountRows: { count: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COUNT(*)', 'count')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .getRawMany();
    const receiptNumber = `REC-${String(Number(receiptCountRows[0]?.count ?? 0) + 1).padStart(5, '0')}`;

    return {
      receiptNumber,
      date: payment.paidAt || payment.createdAt,
      businessInfo: {
        name: this.configService.get<string>('BUSINESS_NAME', 'Tech Service'),
        address: this.configService.get<string>(
          'BUSINESS_ADDRESS',
          'Dirección no configurada',
        ),
        phone: this.configService.get<string>('BUSINESS_PHONE', ''),
        email: this.configService.get<string>('BUSINESS_EMAIL', ''),
      },
      client: {
        name: payment.workOrder.client.name,
        email: payment.workOrder.client.email,
      },
      workOrder: {
        trackingCode: payment.workOrder.trackingCode,
        serviceTypeName: payment.workOrder.serviceType.name,
      },
      payment: {
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt || payment.createdAt,
        providerPaymentId: payment.providerPaymentId,
        installmentNumber: payment.installmentNumber,
        totalInstallments: payment.totalInstallments,
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────

  private resolvePeriod(filter: PeriodFilterDto): {
    from: Date;
    to: Date;
    label: string;
  } {
    if (filter.dateFrom && filter.dateTo) {
      return {
        from: new Date(filter.dateFrom),
        to: new Date(filter.dateTo),
        label: `${filter.dateFrom} — ${filter.dateTo}`,
      };
    }

    const now = new Date();
    let from: Date;
    let to: Date;
    let label: string;

    switch (filter.period) {
      case 'daily': {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = now;
        label = 'Hoy';
        break;
      }
      case 'weekly': {
        const day = now.getDay();
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        to = now;
        label = 'Esta semana';
        break;
      }
      case 'yearly': {
        from = new Date(now.getFullYear(), 0, 1);
        to = now;
        label = `${now.getFullYear()}`;
        break;
      }
      case 'monthly':
      default: {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = now;
        const monthNames = [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ];
        label = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        break;
      }
    }

    return { from, to, label };
  }

  private getPreviousPeriod(from: Date, to: Date): { from: Date; to: Date } {
    const duration = to.getTime() - from.getTime();
    return {
      from: new Date(from.getTime() - duration),
      to: new Date(from.getTime() - 1),
    };
  }

  private async getKpis(): Promise<SummaryReportDto['kpis']> {
    const incomeRows: { total: string; count: string }[] =
      await this.paymentRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .addSelect('COUNT(*)', 'count')
        .where('p.status = :status', { status: PaymentStatus.APPROVED })
        .getRawMany();

    const expenseRows: { total: string }[] = await this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .getRawMany();

    const materialRows: { total: string }[] = await this.materialRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'total')
      .getRawMany();

    const woTotalRows: { count: string }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('COUNT(*)', 'count')
      .getRawMany();

    const woCompletedRows: { count: string }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('COUNT(*)', 'count')
      .where('wo.status IN (:...statuses)', {
        statuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
      })
      .getRawMany();

    const resolutionRows: { avg_days: string }[] =
      await this.workOrderRepository
        .createQueryBuilder('wo')
        .select(
          'COALESCE(AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 86400), 0)',
          'avg_days',
        )
        .where('wo.status IN (:...statuses)', {
          statuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
        })
        .andWhere('wo.completed_at IS NOT NULL')
        .getRawMany();

    const invoicedRows: { total: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .getRawMany();

    const totalIncome = Number(incomeRows[0]?.total ?? 0);
    const totalExpenses = Number(expenseRows[0]?.total ?? 0);
    const totalMaterialCosts = Number(materialRows[0]?.total ?? 0);
    const workOrderCount = Number(woTotalRows[0]?.count ?? 0);
    const completedCount = Number(woCompletedRows[0]?.count ?? 0);
    const paymentCount = Number(incomeRows[0]?.count ?? 0);
    const invoiced = Number(invoicedRows[0]?.total ?? 0);

    return {
      totalIncome,
      totalExpenses,
      totalMaterialCosts,
      netProfit: totalIncome - totalMaterialCosts - totalExpenses,
      averageTicket: paymentCount > 0 ? totalIncome / paymentCount : 0,
      workOrderCount,
      completedCount,
      completionRate:
        workOrderCount > 0
          ? Math.round((completedCount / workOrderCount) * 10000) / 100
          : 0,
      averageResolutionDays:
        Math.round(Number(resolutionRows[0]?.avg_days ?? 0) * 10) / 10,
      collectionRate:
        invoiced > 0 ? Math.round((totalIncome / invoiced) * 10000) / 100 : 0,
    };
  }

  private async getMonthlyTrend(
    from: Date,
    to: Date,
  ): Promise<SummaryReportDto['monthlyTrend']> {
    const incomeRows: { month: string; total: string }[] =
      await this.paymentRepository
        .createQueryBuilder('p')
        .select("TO_CHAR(p.created_at, 'YYYY-MM')", 'month')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: PaymentStatus.APPROVED })
        .andWhere('p.created_at >= :from', { from })
        .andWhere('p.created_at <= :to', { to })
        .groupBy("TO_CHAR(p.created_at, 'YYYY-MM')")
        .orderBy("TO_CHAR(p.created_at, 'YYYY-MM')", 'ASC')
        .getRawMany();

    const expenseRows: { month: string; total: string }[] =
      await this.expenseRepository
        .createQueryBuilder('e')
        .select("TO_CHAR(e.date, 'YYYY-MM')", 'month')
        .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
        .where('e.date >= :from', {
          from: from.toISOString().split('T')[0],
        })
        .andWhere('e.date <= :to', {
          to: to.toISOString().split('T')[0],
        })
        .groupBy("TO_CHAR(e.date, 'YYYY-MM')")
        .orderBy("TO_CHAR(e.date, 'YYYY-MM')", 'ASC')
        .getRawMany();

    const woRows: { month: string; count: string }[] =
      await this.workOrderRepository
        .createQueryBuilder('wo')
        .select("TO_CHAR(wo.created_at, 'YYYY-MM')", 'month')
        .addSelect('COUNT(*)', 'count')
        .where('wo.created_at >= :from', { from })
        .andWhere('wo.created_at <= :to', { to })
        .groupBy("TO_CHAR(wo.created_at, 'YYYY-MM')")
        .orderBy("TO_CHAR(wo.created_at, 'YYYY-MM')", 'ASC')
        .getRawMany();

    const materialRows: { month: string; total: string }[] =
      await this.materialRepository
        .createQueryBuilder('m')
        .innerJoin('m.workOrder', 'wo')
        .select("TO_CHAR(wo.created_at, 'YYYY-MM')", 'month')
        .addSelect('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'total')
        .where('wo.created_at >= :from', { from })
        .andWhere('wo.created_at <= :to', { to })
        .groupBy("TO_CHAR(wo.created_at, 'YYYY-MM')")
        .orderBy("TO_CHAR(wo.created_at, 'YYYY-MM')", 'ASC')
        .getRawMany();

    const months: string[] = [];
    const d = new Date(from);
    while (d <= to) {
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      );
      d.setMonth(d.getMonth() + 1);
    }

    const monthLabels = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const incomeMap = new Map(
      incomeRows.map((r) => [r.month, Number(r.total)]),
    );
    const expenseMap = new Map(
      expenseRows.map((r) => [r.month, Number(r.total)]),
    );
    const woMap = new Map(woRows.map((r) => [r.month, Number(r.count)]));
    const matMap = new Map(materialRows.map((r) => [r.month, Number(r.total)]));

    return {
      labels: months.map((m) => {
        const [, mm] = m.split('-');
        return monthLabels[Number(mm) - 1];
      }),
      income: months.map((m) => incomeMap.get(m) ?? 0),
      expenses: months.map((m) => expenseMap.get(m) ?? 0),
      profit: months.map(
        (m) =>
          (incomeMap.get(m) ?? 0) -
          (matMap.get(m) ?? 0) -
          (expenseMap.get(m) ?? 0),
      ),
      workOrderCount: months.map((m) => woMap.get(m) ?? 0),
    };
  }

  private async getWorkOrdersByStatus(): Promise<
    SummaryReportDto['workOrdersByStatus']
  > {
    const statusLabels: Record<string, string> = {
      pending: 'Pendientes',
      assigned: 'Asignadas',
      in_progress: 'En progreso',
      postponed: 'Pospuestas',
      completed: 'Completadas',
      delivered: 'Entregadas',
      cancelled: 'Canceladas',
    };

    const rows: { status: string; count: string }[] =
      await this.workOrderRepository
        .createQueryBuilder('wo')
        .select('wo.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('wo.status')
        .getRawMany();

    const total = rows.reduce((s, r) => s + Number(r.count), 0);

    return rows.map((r) => ({
      status: r.status,
      label: statusLabels[r.status] || r.status,
      count: Number(r.count),
      percentage:
        total > 0 ? Math.round((Number(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  private async getTopServices(
    from: Date,
    to: Date,
  ): Promise<SummaryReportDto['topServices']> {
    const rows: { name: string; count: string; revenue: string }[] =
      await this.workOrderRepository
        .createQueryBuilder('wo')
        .innerJoin('wo.serviceType', 'st')
        .leftJoin('wo.payments', 'p', 'p.status = :pStatus', {
          pStatus: PaymentStatus.APPROVED,
        })
        .select('st.name', 'name')
        .addSelect('COUNT(DISTINCT wo.id)', 'count')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
        .where('wo.created_at >= :from', { from })
        .andWhere('wo.created_at <= :to', { to })
        .groupBy('st.name')
        .orderBy('COUNT(DISTINCT wo.id)', 'DESC')
        .limit(5)
        .getRawMany();

    return rows.map((r) => ({
      name: r.name,
      count: Number(r.count),
      revenue: Number(r.revenue),
    }));
  }

  private async getPaymentMethodDistribution(
    from: Date,
    to: Date,
  ): Promise<SummaryReportDto['paymentMethodDistribution']> {
    const methodLabels: Record<string, string> = {
      credit_card: 'Tarjeta de crédito',
      debit_card: 'Tarjeta de débito',
      cash: 'Efectivo',
      transfer: 'Transferencia',
    };

    const rows: { method: string; count: string; total: string }[] =
      await this.paymentRepository
        .createQueryBuilder('p')
        .select('p.method', 'method')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: PaymentStatus.APPROVED })
        .andWhere('p.created_at >= :from', { from })
        .andWhere('p.created_at <= :to', { to })
        .groupBy('p.method')
        .getRawMany();

    const total = rows.reduce((s, r) => s + Number(r.total), 0);

    return rows.map((r) => ({
      method: r.method,
      label: methodLabels[r.method] || r.method,
      count: Number(r.count),
      total: Number(r.total),
      percentage:
        total > 0 ? Math.round((Number(r.total) / total) * 10000) / 100 : 0,
    }));
  }

  private async getTopClients(): Promise<SummaryReportDto['topClients']> {
    const rows: {
      id: string;
      name: string;
      wo_count: string;
      total_spent: string;
      last_date: string;
    }[] = await this.clientRepository
      .createQueryBuilder('c')
      .innerJoin('work_orders', 'wo', 'wo.client_id = c.id')
      .leftJoin(
        'payments',
        'p',
        'p.work_order_id = wo.id AND p.status = :pStatus',
        { pStatus: PaymentStatus.APPROVED },
      )
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('COUNT(DISTINCT wo.id)', 'wo_count')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total_spent')
      .addSelect('MAX(wo.created_at)', 'last_date')
      .groupBy('c.id')
      .addGroupBy('c.name')
      .orderBy('COALESCE(SUM(p.amount), 0)', 'DESC')
      .limit(5)
      .getRawMany();

    return rows.map((r) => ({
      clientId: r.id,
      clientName: r.name,
      workOrderCount: Number(r.wo_count),
      totalSpent: Number(r.total_spent),
      lastWorkOrderDate: new Date(r.last_date),
    }));
  }

  private async getTechnicianPerformance(): Promise<
    SummaryReportDto['technicianPerformance']
  > {
    const rows: {
      id: string;
      name: string;
      completed: string;
      avg_days: string;
      revenue: string;
    }[] = await this.userRepository
      .createQueryBuilder('u')
      .innerJoin('work_order_technicians', 'wot', 'wot.user_id = u.id')
      .innerJoin(
        'work_orders',
        'wo',
        'wo.id = wot.work_order_id AND wo.status = :completed',
        { completed: WorkOrderStatus.COMPLETED },
      )
      .leftJoin(
        'payments',
        'p',
        'p.work_order_id = wo.id AND p.status = :pStatus',
        { pStatus: PaymentStatus.APPROVED },
      )
      .select('u.id', 'id')
      .addSelect('u.name', 'name')
      .addSelect('COUNT(DISTINCT wo.id)', 'completed')
      .addSelect(
        'COALESCE(AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 86400), 0)',
        'avg_days',
      )
      .addSelect('COALESCE(SUM(p.amount), 0)', 'revenue')
      .where('u.role = :role', { role: UserRole.TECHNICIAN })
      .groupBy('u.id')
      .addGroupBy('u.name')
      .orderBy('COUNT(DISTINCT wo.id)', 'DESC')
      .limit(5)
      .getRawMany();

    return rows.map((r) => ({
      technicianId: r.id,
      name: r.name,
      completedOrders: Number(r.completed),
      averageResolutionDays: Math.round(Number(r.avg_days) * 10) / 10,
      totalRevenue: Number(r.revenue),
    }));
  }

  private async getWorkOrdersByPriority(): Promise<
    SummaryReportDto['workOrdersByPriority']
  > {
    const priorityLabels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };

    const rows: { priority: string; count: string }[] =
      await this.workOrderRepository
        .createQueryBuilder('wo')
        .select('wo.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .groupBy('wo.priority')
        .getRawMany();

    return rows.map((r) => ({
      priority: r.priority,
      label: priorityLabels[r.priority] || r.priority,
      count: Number(r.count),
    }));
  }

  private async getTrends(): Promise<SummaryReportDto['trends']> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisIncome: { total: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .andWhere('p.created_at >= :from', { from: thisMonthStart })
      .getRawMany();

    const lastIncome: { total: string }[] = await this.paymentRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: PaymentStatus.APPROVED })
      .andWhere('p.created_at >= :from', { from: lastMonthStart })
      .andWhere('p.created_at <= :to', { to: lastMonthEnd })
      .getRawMany();

    const thisOrders: { count: string }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('COUNT(*)', 'count')
      .where('wo.created_at >= :from', { from: thisMonthStart })
      .getRawMany();

    const lastOrders: { count: string }[] = await this.workOrderRepository
      .createQueryBuilder('wo')
      .select('COUNT(*)', 'count')
      .where('wo.created_at >= :from', { from: lastMonthStart })
      .andWhere('wo.created_at <= :to', { to: lastMonthEnd })
      .getRawMany();

    const thisExpenses: { total: string }[] = await this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.date >= :from', {
        from: thisMonthStart.toISOString().split('T')[0],
      })
      .getRawMany();

    const lastExpenses: { total: string }[] = await this.expenseRepository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.date >= :from', {
        from: lastMonthStart.toISOString().split('T')[0],
      })
      .andWhere('e.date <= :to', {
        to: lastMonthEnd.toISOString().split('T')[0],
      })
      .getRawMany();

    const thisMaterials: { total: string }[] = await this.materialRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'total')
      .innerJoin('m.workOrder', 'wo')
      .where('wo.created_at >= :from', { from: thisMonthStart })
      .getRawMany();

    const lastMaterials: { total: string }[] = await this.materialRepository
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.quantity * m.unit_cost), 0)', 'total')
      .innerJoin('m.workOrder', 'wo')
      .where('wo.created_at >= :from', { from: lastMonthStart })
      .andWhere('wo.created_at <= :to', { to: lastMonthEnd })
      .getRawMany();

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 10000) / 100 : 0;

    const thisIncomeVal = Number(thisIncome[0]?.total ?? 0);
    const lastIncomeVal = Number(lastIncome[0]?.total ?? 0);
    const thisOrdersVal = Number(thisOrders[0]?.count ?? 0);
    const lastOrdersVal = Number(lastOrders[0]?.count ?? 0);
    const thisProfit =
      thisIncomeVal -
      Number(thisMaterials[0]?.total ?? 0) -
      Number(thisExpenses[0]?.total ?? 0);
    const lastProfit =
      lastIncomeVal -
      Number(lastMaterials[0]?.total ?? 0) -
      Number(lastExpenses[0]?.total ?? 0);
    const thisTicket = thisOrdersVal > 0 ? thisIncomeVal / thisOrdersVal : 0;
    const lastTicket = lastOrdersVal > 0 ? lastIncomeVal / lastOrdersVal : 0;

    return {
      incomeChange: calcChange(thisIncomeVal, lastIncomeVal),
      ordersChange: calcChange(thisOrdersVal, lastOrdersVal),
      profitChange: calcChange(thisProfit, lastProfit),
      averageTicketChange: calcChange(thisTicket, lastTicket),
    };
  }
}
