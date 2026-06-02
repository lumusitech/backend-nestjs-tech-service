import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ReportsService } from './reports.service';
import { Payment } from '../payments/entities/payment.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { WorkOrderMaterial } from '../work-orders/entities/work-order-material.entity';
import { Expense } from '../finances/entities/expense.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '../common/testing/mock-query-builder.helper';

describe('ReportsService', () => {
  let service: ReportsService;
  let paymentRepo: ReturnType<typeof createMockRepository>;
  let workOrderRepo: ReturnType<typeof createMockRepository>;
  let materialRepo: ReturnType<typeof createMockRepository>;
  let expenseRepo: ReturnType<typeof createMockRepository>;
  let clientRepo: ReturnType<typeof createMockRepository>;
  let userRepo: ReturnType<typeof createMockRepository>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => defaultValue ?? ''),
  };

  const mockDataSource = {};

  beforeEach(async () => {
    paymentRepo = createMockRepository();
    workOrderRepo = createMockRepository();
    materialRepo = createMockRepository();
    expenseRepo = createMockRepository();
    clientRepo = createMockRepository();
    userRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
        { provide: getRepositoryToken(WorkOrder), useValue: workOrderRepo },
        {
          provide: getRepositoryToken(WorkOrderMaterial),
          useValue: materialRepo,
        },
        { provide: getRepositoryToken(Expense), useValue: expenseRepo },
        { provide: getRepositoryToken(Client), useValue: clientRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should return summary with all sections', async () => {
      paymentRepo.createQueryBuilder
        .mockReturnValueOnce(
          createMockQueryBuilder([{ total: '10000', count: '5' }]),
        )
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '5000' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '15000' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '8000' }]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '6000' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '12000' }]));

      expenseRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '3000' }]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '2500' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '3500' }]));

      materialRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '2000' }]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '1500' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ total: '2500' }]));

      workOrderRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQueryBuilder([{ count: '10' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ count: '7' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ avg_days: '3.5' }]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([]))
        .mockReturnValueOnce(createMockQueryBuilder([{ count: '4' }]))
        .mockReturnValueOnce(createMockQueryBuilder([{ count: '6' }]));

      clientRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));
      userRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder([]));

      const result = await service.getSummary();

      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('monthlyTrend');
      expect(result).toHaveProperty('workOrdersByStatus');
      expect(result).toHaveProperty('topServices');
      expect(result).toHaveProperty('paymentMethodDistribution');
      expect(result).toHaveProperty('topClients');
      expect(result).toHaveProperty('technicianPerformance');
      expect(result).toHaveProperty('workOrdersByPriority');
      expect(result).toHaveProperty('trends');
      expect(result.kpis).toHaveProperty('totalIncome');
      expect(result.kpis).toHaveProperty('totalExpenses');
      expect(result.kpis).toHaveProperty('netProfit');
      expect(result.kpis).toHaveProperty('workOrderCount');
      expect(result.kpis).toHaveProperty('completionRate');
      expect(result.monthlyTrend).toHaveProperty('labels');
      expect(result.monthlyTrend).toHaveProperty('income');
      expect(result.monthlyTrend).toHaveProperty('expenses');
      expect(result.monthlyTrend).toHaveProperty('profit');
      expect(result.trends).toHaveProperty('incomeChange');
      expect(result.trends).toHaveProperty('ordersChange');
    });

    it('should handle empty data gracefully', async () => {
      const emptyQb = createMockQueryBuilder([]);

      paymentRepo.createQueryBuilder.mockReturnValue(emptyQb);
      expenseRepo.createQueryBuilder.mockReturnValue(emptyQb);
      materialRepo.createQueryBuilder.mockReturnValue(emptyQb);
      workOrderRepo.createQueryBuilder.mockReturnValue(emptyQb);
      clientRepo.createQueryBuilder.mockReturnValue(emptyQb);
      userRepo.createQueryBuilder.mockReturnValue(emptyQb);

      const result = await service.getSummary();

      expect(result.kpis.totalIncome).toBe(0);
      expect(result.kpis.totalExpenses).toBe(0);
      expect(result.kpis.netProfit).toBe(0);
      expect(result.kpis.workOrderCount).toBe(0);
      expect(result.kpis.completionRate).toBe(0);
      expect(result.workOrdersByStatus).toEqual([]);
      expect(result.topServices).toEqual([]);
      expect(result.topClients).toEqual([]);
    });
  });

  describe('getIncome', () => {
    it('should return income report with correct structure', async () => {
      const totalQb = createMockQueryBuilder([{ total: '50000', count: '10' }]);
      const methodQb = createMockQueryBuilder([
        { method: 'cash', total: '30000', count: '6' },
        { method: 'transfer', total: '20000', count: '4' },
      ]);
      const dayQb = createMockQueryBuilder([
        { date: '2026-01-15', total: '25000' },
        { date: '2026-01-16', total: '25000' },
      ]);
      const prevQb = createMockQueryBuilder([{ total: '40000' }]);

      paymentRepo.createQueryBuilder
        .mockReturnValueOnce(totalQb)
        .mockReturnValueOnce(methodQb)
        .mockReturnValueOnce(dayQb)
        .mockReturnValueOnce(prevQb);

      const result = await service.getIncome({ period: 'monthly' });

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('paymentCount');
      expect(result).toHaveProperty('averageTicket');
      expect(result).toHaveProperty('byMethod');
      expect(result).toHaveProperty('byDay');
      expect(result).toHaveProperty('previousPeriodTotal');
      expect(result).toHaveProperty('changePercentage');
      expect(result.totalIncome).toBe(50000);
      expect(result.paymentCount).toBe(10);
      expect(result.averageTicket).toBe(5000);
      expect(result.byMethod).toHaveLength(2);
      expect(result.byMethod[0]).toHaveProperty('method');
      expect(result.byMethod[0]).toHaveProperty('label');
      expect(result.byMethod[0]).toHaveProperty('total');
      expect(result.byMethod[0]).toHaveProperty('count');
      expect(result.byMethod[0]).toHaveProperty('percentage');
      expect(result.byDay).toHaveLength(2);
      expect(result.byDay[0]).toHaveProperty('date');
      expect(result.byDay[0]).toHaveProperty('total');
      expect(result.previousPeriodTotal).toBe(40000);
    });

    it('should handle empty data gracefully', async () => {
      const emptyTotalQb = createMockQueryBuilder([{ total: '0', count: '0' }]);
      const emptyQb = createMockQueryBuilder([]);
      const emptyPrevQb = createMockQueryBuilder([{ total: '0' }]);

      paymentRepo.createQueryBuilder
        .mockReturnValueOnce(emptyTotalQb)
        .mockReturnValueOnce(emptyQb)
        .mockReturnValueOnce(emptyQb)
        .mockReturnValueOnce(emptyPrevQb);

      const result = await service.getIncome({ period: 'monthly' });

      expect(result.totalIncome).toBe(0);
      expect(result.paymentCount).toBe(0);
      expect(result.averageTicket).toBe(0);
      expect(result.byMethod).toEqual([]);
      expect(result.byDay).toEqual([]);
      expect(result.previousPeriodTotal).toBe(0);
      expect(result.changePercentage).toBe(0);
    });

    it('should use custom date range when provided', async () => {
      const totalQb = createMockQueryBuilder([{ total: '10000', count: '2' }]);
      const methodQb = createMockQueryBuilder([]);
      const dayQb = createMockQueryBuilder([]);
      const prevQb = createMockQueryBuilder([{ total: '0' }]);

      paymentRepo.createQueryBuilder
        .mockReturnValueOnce(totalQb)
        .mockReturnValueOnce(methodQb)
        .mockReturnValueOnce(dayQb)
        .mockReturnValueOnce(prevQb);

      const result = await service.getIncome({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(result.period.label).toBe('2026-01-01 — 2026-01-31');
    });
  });

  describe('getExpenses', () => {
    it('should return expense report with correct structure', async () => {
      const categoryQb = createMockQueryBuilder([
        { category: 'rent', total: '20000', count: '1' },
        { category: 'utilities', total: '5000', count: '3' },
      ]);
      const prevQb = createMockQueryBuilder([{ total: '22000' }]);

      expenseRepo.createQueryBuilder
        .mockReturnValueOnce(categoryQb)
        .mockReturnValueOnce(prevQb);

      const result = await service.getExpenses({ period: 'monthly' });

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalExpenses');
      expect(result).toHaveProperty('byCategory');
      expect(result).toHaveProperty('previousPeriodTotal');
      expect(result).toHaveProperty('changePercentage');
      expect(result.totalExpenses).toBe(25000);
      expect(result.byCategory).toHaveLength(2);
      expect(result.byCategory[0]).toHaveProperty('category');
      expect(result.byCategory[0]).toHaveProperty('label');
      expect(result.byCategory[0]).toHaveProperty('total');
      expect(result.byCategory[0]).toHaveProperty('count');
      expect(result.byCategory[0]).toHaveProperty('percentage');
      expect(result.previousPeriodTotal).toBe(22000);
    });

    it('should handle empty data gracefully', async () => {
      const emptyQb = createMockQueryBuilder([]);
      const emptyPrevQb = createMockQueryBuilder([{ total: '0' }]);

      expenseRepo.createQueryBuilder
        .mockReturnValueOnce(emptyQb)
        .mockReturnValueOnce(emptyPrevQb);

      const result = await service.getExpenses({ period: 'monthly' });

      expect(result.totalExpenses).toBe(0);
      expect(result.byCategory).toEqual([]);
      expect(result.previousPeriodTotal).toBe(0);
      expect(result.changePercentage).toBe(0);
    });

    it('should apply category filter when provided', async () => {
      const categoryQb = createMockQueryBuilder([
        { category: 'rent', total: '20000', count: '1' },
      ]);
      const prevQb = createMockQueryBuilder([{ total: '0' }]);

      expenseRepo.createQueryBuilder
        .mockReturnValueOnce(categoryQb)
        .mockReturnValueOnce(prevQb);

      await service.getExpenses({ period: 'monthly', category: 'rent' });

      expect(categoryQb.andWhere).toHaveBeenCalledWith(
        'e.category = :category',
        { category: 'rent' },
      );
    });
  });

  describe('getProfit', () => {
    it('should return profit report with correct structure', async () => {
      const incomeQb = createMockQueryBuilder([{ total: '100000' }]);
      const materialQb = createMockQueryBuilder([{ total: '20000' }]);
      const expenseQb = createMockQueryBuilder([{ total: '30000' }]);
      const woCountQb = createMockQueryBuilder([{ count: '15' }]);
      const prevIncomeQb = createMockQueryBuilder([{ total: '80000' }]);
      const prevMaterialQb = createMockQueryBuilder([{ total: '15000' }]);
      const prevExpenseQb = createMockQueryBuilder([{ total: '25000' }]);

      paymentRepo.createQueryBuilder
        .mockReturnValueOnce(incomeQb)
        .mockReturnValueOnce(prevIncomeQb);
      materialRepo.createQueryBuilder
        .mockReturnValueOnce(materialQb)
        .mockReturnValueOnce(prevMaterialQb);
      expenseRepo.createQueryBuilder
        .mockReturnValueOnce(expenseQb)
        .mockReturnValueOnce(prevExpenseQb);
      workOrderRepo.createQueryBuilder.mockReturnValueOnce(woCountQb);

      const result = await service.getProfit({ period: 'monthly' });

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('materialCosts');
      expect(result).toHaveProperty('operationalExpenses');
      expect(result).toHaveProperty('grossProfit');
      expect(result).toHaveProperty('netProfit');
      expect(result).toHaveProperty('workOrderCount');
      expect(result).toHaveProperty('previousPeriodNetProfit');
      expect(result).toHaveProperty('changePercentage');
      expect(result.income).toBe(100000);
      expect(result.materialCosts).toBe(20000);
      expect(result.operationalExpenses).toBe(30000);
      expect(result.grossProfit).toBe(80000);
      expect(result.netProfit).toBe(50000);
      expect(result.workOrderCount).toBe(15);
      expect(result.previousPeriodNetProfit).toBe(40000);
    });

    it('should handle empty data gracefully', async () => {
      const zeroQb = createMockQueryBuilder([{ total: '0' }]);
      const zeroCountQb = createMockQueryBuilder([{ count: '0' }]);

      paymentRepo.createQueryBuilder
        .mockReturnValueOnce(zeroQb)
        .mockReturnValueOnce(zeroQb);
      materialRepo.createQueryBuilder
        .mockReturnValueOnce(zeroQb)
        .mockReturnValueOnce(zeroQb);
      expenseRepo.createQueryBuilder
        .mockReturnValueOnce(zeroQb)
        .mockReturnValueOnce(zeroQb);
      workOrderRepo.createQueryBuilder.mockReturnValueOnce(zeroCountQb);

      const result = await service.getProfit({ period: 'monthly' });

      expect(result.income).toBe(0);
      expect(result.materialCosts).toBe(0);
      expect(result.operationalExpenses).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.netProfit).toBe(0);
      expect(result.workOrderCount).toBe(0);
      expect(result.previousPeriodNetProfit).toBe(0);
      expect(result.changePercentage).toBe(0);
    });
  });

  describe('getServices', () => {
    it('should return services report with correct structure', async () => {
      const servicesQb = createMockQueryBuilder([
        { name: 'Reparación PC', count: '10', revenue: '50000' },
        { name: 'Instalación Cámaras', count: '5', revenue: '80000' },
      ]);

      workOrderRepo.createQueryBuilder.mockReturnValueOnce(servicesQb);

      const result = await service.getServices({ period: 'monthly' });

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveLength(2);
      expect(result.services[0]).toHaveProperty('name');
      expect(result.services[0]).toHaveProperty('count');
      expect(result.services[0]).toHaveProperty('revenue');
      expect(result.services[0].name).toBe('Reparación PC');
      expect(result.services[0].count).toBe(10);
      expect(result.services[0].revenue).toBe(50000);
    });

    it('should handle empty data gracefully', async () => {
      const emptyQb = createMockQueryBuilder([]);
      workOrderRepo.createQueryBuilder.mockReturnValueOnce(emptyQb);

      const result = await service.getServices({ period: 'monthly' });

      expect(result.services).toEqual([]);
    });
  });

  describe('getTechnicianRanking', () => {
    it('should return technician ranking with correct structure', async () => {
      const rankingQb = createMockQueryBuilder([
        {
          id: 'tech-1',
          name: 'Juan',
          completed: '15',
          avg_days: '2.5',
          revenue: '75000',
        },
        {
          id: 'tech-2',
          name: 'Pedro',
          completed: '10',
          avg_days: '3.1',
          revenue: '50000',
        },
      ]);

      userRepo.createQueryBuilder.mockReturnValueOnce(rankingQb);

      const result = await service.getTechnicianRanking();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('technicianId');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('completedOrders');
      expect(result[0]).toHaveProperty('averageResolutionDays');
      expect(result[0]).toHaveProperty('totalRevenue');
      expect(result[0].technicianId).toBe('tech-1');
      expect(result[0].name).toBe('Juan');
      expect(result[0].completedOrders).toBe(15);
      expect(result[0].averageResolutionDays).toBe(2.5);
      expect(result[0].totalRevenue).toBe(75000);
    });

    it('should handle empty data gracefully', async () => {
      const emptyQb = createMockQueryBuilder([]);
      userRepo.createQueryBuilder.mockReturnValueOnce(emptyQb);

      const result = await service.getTechnicianRanking();

      expect(result).toEqual([]);
    });
  });

  describe('getTechnicianDetail', () => {
    it('should return technician detail with correct structure', async () => {
      const mockUser = {
        id: 'tech-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: 'technician',
      };

      userRepo.findOne.mockResolvedValue(mockUser);

      const statsQb = createMockQueryBuilder([
        {
          completed: '12',
          in_progress: '3',
          avg_days: '2.8',
          revenue: '60000',
        },
      ]);
      const ordersQb = createMockQueryBuilder([
        {
          tracking_code: 'TS-A1B2C',
          service_name: 'Reparación PC',
          status: 'completed',
          completed_at: new Date('2026-01-15'),
        },
      ]);

      userRepo.createQueryBuilder.mockReturnValueOnce(statsQb);
      workOrderRepo.createQueryBuilder.mockReturnValueOnce(ordersQb);

      const result = await service.getTechnicianDetail('tech-1');

      expect(result).toHaveProperty('technicianId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('completedOrders');
      expect(result).toHaveProperty('inProgressOrders');
      expect(result).toHaveProperty('averageResolutionDays');
      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('recentOrders');
      expect(result.technicianId).toBe('tech-1');
      expect(result.name).toBe('Juan');
      expect(result.completedOrders).toBe(12);
      expect(result.inProgressOrders).toBe(3);
      expect(result.averageResolutionDays).toBe(2.8);
      expect(result.totalRevenue).toBe(60000);
      expect(result.recentOrders).toHaveLength(1);
      expect(result.recentOrders[0]).toHaveProperty('trackingCode');
      expect(result.recentOrders[0]).toHaveProperty('serviceTypeName');
      expect(result.recentOrders[0]).toHaveProperty('status');
      expect(result.recentOrders[0]).toHaveProperty('completedAt');
    });

    it('should throw NotFoundException when technician not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getTechnicianDetail('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getTechnicianDetail('non-existent')).rejects.toThrow(
        'Technician #non-existent not found',
      );
    });

    it('should handle empty stats and orders gracefully', async () => {
      const mockUser = {
        id: 'tech-1',
        name: 'Juan',
        email: 'juan@test.com',
        role: 'technician',
      };

      userRepo.findOne.mockResolvedValue(mockUser);

      const emptyStatsQb = createMockQueryBuilder([]);
      const emptyOrdersQb = createMockQueryBuilder([]);

      userRepo.createQueryBuilder.mockReturnValueOnce(emptyStatsQb);
      workOrderRepo.createQueryBuilder.mockReturnValueOnce(emptyOrdersQb);

      const result = await service.getTechnicianDetail('tech-1');

      expect(result.completedOrders).toBe(0);
      expect(result.inProgressOrders).toBe(0);
      expect(result.averageResolutionDays).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.recentOrders).toEqual([]);
    });
  });

  describe('getClientReport', () => {
    it('should return client report with correct structure', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Carlos',
        email: 'carlos@test.com',
        phone: '123456',
        address: 'Calle 123',
      };

      const mockWorkOrders = [
        {
          id: 'wo-1',
          trackingCode: 'TS-A1B2C',
          status: 'completed',
          createdAt: new Date('2026-01-01'),
          completedAt: new Date('2026-01-10'),
          serviceType: { name: 'Reparación PC' },
          payments: [
            {
              id: 'pay-1',
              amount: 15000,
              method: 'cash',
              status: 'approved',
              paidAt: new Date('2026-01-10'),
              createdAt: new Date('2026-01-10'),
              workOrderId: 'wo-1',
            },
          ],
          materials: [
            {
              quantity: 2,
              unitCost: 500,
            },
          ],
        },
        {
          id: 'wo-2',
          trackingCode: 'TS-D4E5F',
          status: 'pending',
          createdAt: new Date('2026-02-01'),
          completedAt: null,
          serviceType: { name: 'Instalación Cámaras' },
          payments: [
            {
              id: 'pay-2',
              amount: 25000,
              method: 'transfer',
              status: 'pending',
              paidAt: null,
              createdAt: new Date('2026-02-01'),
              workOrderId: 'wo-2',
            },
          ],
          materials: [],
        },
      ];

      clientRepo.findOne.mockResolvedValue(mockClient);
      workOrderRepo.find.mockResolvedValue(mockWorkOrders);

      const result = await service.getClientReport('client-1');

      expect(result).toHaveProperty('client');
      expect(result).toHaveProperty('kpis');
      expect(result).toHaveProperty('workOrders');
      expect(result).toHaveProperty('paymentHistory');
      expect(result.client.id).toBe('client-1');
      expect(result.client.name).toBe('Carlos');
      expect(result.kpis).toHaveProperty('totalWorkOrders');
      expect(result.kpis).toHaveProperty('completedOrders');
      expect(result.kpis).toHaveProperty('totalSpent');
      expect(result.kpis).toHaveProperty('outstandingDebt');
      expect(result.kpis).toHaveProperty('averageTicket');
      expect(result.kpis).toHaveProperty('lastServiceDate');
      expect(result.kpis).toHaveProperty('isRecurrent');
      expect(result.kpis.totalWorkOrders).toBe(2);
      expect(result.kpis.completedOrders).toBe(1);
      expect(result.kpis.totalSpent).toBe(15000);
      expect(result.kpis.outstandingDebt).toBe(25000);
      expect(result.kpis.isRecurrent).toBe(false);
      expect(result.workOrders).toHaveLength(2);
      expect(result.workOrders[0]).toHaveProperty('id');
      expect(result.workOrders[0]).toHaveProperty('trackingCode');
      expect(result.workOrders[0]).toHaveProperty('status');
      expect(result.workOrders[0]).toHaveProperty('serviceTypeName');
      expect(result.workOrders[0]).toHaveProperty('totalPaid');
      expect(result.workOrders[0]).toHaveProperty('pendingAmount');
      expect(result.workOrders[0]).toHaveProperty('materialsCost');
      expect(result.paymentHistory).toHaveLength(2);
      expect(result.paymentHistory[0]).toHaveProperty('id');
      expect(result.paymentHistory[0]).toHaveProperty('amount');
      expect(result.paymentHistory[0]).toHaveProperty('method');
      expect(result.paymentHistory[0]).toHaveProperty('status');
      expect(result.paymentHistory[0]).toHaveProperty('trackingCode');
    });

    it('should throw NotFoundException when client not found', async () => {
      clientRepo.findOne.mockResolvedValue(null);

      await expect(service.getClientReport('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getClientReport('non-existent')).rejects.toThrow(
        'Client #non-existent not found',
      );
    });

    it('should handle client with no work orders', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Carlos',
        email: 'carlos@test.com',
        phone: '123456',
        address: 'Calle 123',
      };

      clientRepo.findOne.mockResolvedValue(mockClient);
      workOrderRepo.find.mockResolvedValue([]);

      const result = await service.getClientReport('client-1');

      expect(result.kpis.totalWorkOrders).toBe(0);
      expect(result.kpis.completedOrders).toBe(0);
      expect(result.kpis.totalSpent).toBe(0);
      expect(result.kpis.outstandingDebt).toBe(0);
      expect(result.kpis.averageTicket).toBe(0);
      expect(result.kpis.lastServiceDate).toBeNull();
      expect(result.kpis.isRecurrent).toBe(false);
      expect(result.workOrders).toEqual([]);
      expect(result.paymentHistory).toEqual([]);
    });

    it('should mark client as recurrent when 3+ work orders', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Carlos',
        email: 'carlos@test.com',
        phone: '123456',
        address: 'Calle 123',
      };

      const mockWorkOrders = [
        {
          id: 'wo-1',
          trackingCode: 'TS-A1B2C',
          status: 'completed',
          createdAt: new Date('2026-01-01'),
          completedAt: new Date('2026-01-10'),
          serviceType: { name: 'Servicio 1' },
          payments: [],
          materials: [],
        },
        {
          id: 'wo-2',
          trackingCode: 'TS-D4E5F',
          status: 'completed',
          createdAt: new Date('2026-02-01'),
          completedAt: new Date('2026-02-05'),
          serviceType: { name: 'Servicio 2' },
          payments: [],
          materials: [],
        },
        {
          id: 'wo-3',
          trackingCode: 'TS-G6H7I',
          status: 'completed',
          createdAt: new Date('2026-03-01'),
          completedAt: new Date('2026-03-05'),
          serviceType: { name: 'Servicio 3' },
          payments: [],
          materials: [],
        },
      ];

      clientRepo.findOne.mockResolvedValue(mockClient);
      workOrderRepo.find.mockResolvedValue(mockWorkOrders);

      const result = await service.getClientReport('client-1');

      expect(result.kpis.totalWorkOrders).toBe(3);
      expect(result.kpis.isRecurrent).toBe(true);
    });
  });

  describe('getBudgetData', () => {
    it('should return budget data with correct structure', async () => {
      const mockWorkOrder = {
        id: 'wo-1',
        trackingCode: 'TS-A1B2C',
        diagnosis: 'Screen broken',
        scheduledDate: new Date('2026-01-15'),
        client: {
          name: 'Carlos',
          email: 'carlos@test.com',
          phone: '123456',
          address: 'Calle 123',
        },
        serviceType: { name: 'Reparación PC' },
        materials: [
          {
            description: 'Pantalla',
            quantity: 1,
            unitCost: 15000,
          },
          {
            description: 'Cable',
            quantity: 2,
            unitCost: 500,
          },
        ],
      };

      workOrderRepo.findOne.mockResolvedValue(mockWorkOrder);
      const countQb = createMockQueryBuilder([{ count: '50' }]);
      workOrderRepo.createQueryBuilder.mockReturnValueOnce(countQb);

      const result = await service.getBudgetData('wo-1');

      expect(result).toHaveProperty('budgetNumber');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('validUntil');
      expect(result).toHaveProperty('businessInfo');
      expect(result).toHaveProperty('client');
      expect(result).toHaveProperty('workOrder');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('laborCost');
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('notes');
      expect(result.budgetNumber).toBe('BUD-00051');
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toHaveProperty('description');
      expect(result.items[0]).toHaveProperty('quantity');
      expect(result.items[0]).toHaveProperty('unitPrice');
      expect(result.items[0]).toHaveProperty('subtotal');
      expect(result.subtotal).toBe(16000);
      expect(result.total).toBe(16000);
      expect(result.client.name).toBe('Carlos');
      expect(result.workOrder.trackingCode).toBe('TS-A1B2C');
    });

    it('should throw NotFoundException when work order not found', async () => {
      workOrderRepo.findOne.mockResolvedValue(null);

      await expect(service.getBudgetData('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getBudgetData('non-existent')).rejects.toThrow(
        'Work order #non-existent not found',
      );
    });
  });

  describe('getReceiptData', () => {
    it('should return receipt data with correct structure', async () => {
      const mockPayment = {
        id: 'pay-1',
        amount: 15000,
        method: 'cash',
        status: 'approved',
        paidAt: new Date('2026-01-10'),
        createdAt: new Date('2026-01-10'),
        providerPaymentId: 'mp-123',
        installmentNumber: 1,
        totalInstallments: 1,
        workOrder: {
          trackingCode: 'TS-A1B2C',
          client: {
            name: 'Carlos',
            email: 'carlos@test.com',
          },
          serviceType: { name: 'Reparación PC' },
        },
      };

      paymentRepo.findOne.mockResolvedValue(mockPayment);
      const countQb = createMockQueryBuilder([{ count: '25' }]);
      paymentRepo.createQueryBuilder.mockReturnValueOnce(countQb);

      const result = await service.getReceiptData('pay-1');

      expect(result).toHaveProperty('receiptNumber');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('businessInfo');
      expect(result).toHaveProperty('client');
      expect(result).toHaveProperty('workOrder');
      expect(result).toHaveProperty('payment');
      expect(result.receiptNumber).toBe('REC-00026');
      expect(result.client.name).toBe('Carlos');
      expect(result.workOrder.trackingCode).toBe('TS-A1B2C');
      expect(result.payment.amount).toBe(15000);
      expect(result.payment.method).toBe('cash');
      expect(result.payment.status).toBe('approved');
      expect(result.payment.providerPaymentId).toBe('mp-123');
    });

    it('should throw NotFoundException when payment not found', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.getReceiptData('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getReceiptData('non-existent')).rejects.toThrow(
        'Payment #non-existent not found',
      );
    });

    it('should use createdAt when paidAt is null', async () => {
      const mockPayment = {
        id: 'pay-1',
        amount: 10000,
        method: 'transfer',
        status: 'approved',
        paidAt: null,
        createdAt: new Date('2026-01-10'),
        providerPaymentId: null,
        installmentNumber: 1,
        totalInstallments: 1,
        workOrder: {
          trackingCode: 'TS-X9Y8Z',
          client: { name: 'Ana', email: 'ana@test.com' },
          serviceType: { name: 'Instalación' },
        },
      };

      paymentRepo.findOne.mockResolvedValue(mockPayment);
      const countQb = createMockQueryBuilder([{ count: '10' }]);
      paymentRepo.createQueryBuilder.mockReturnValueOnce(countQb);

      const result = await service.getReceiptData('pay-1');

      expect(result.date).toEqual(new Date('2026-01-10'));
      expect(result.payment.paidAt).toEqual(new Date('2026-01-10'));
    });
  });
});
