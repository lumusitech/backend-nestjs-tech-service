import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import {
  authHeader,
  loginAsAdmin,
  loginAsTechnician,
} from './helpers/auth.helper';

describe('Reports (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let techToken: string;
  let seed: SeedData;
  let workOrderId: string;
  let paymentId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);
    techToken = await loginAsTechnician(app);

    const woRes = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(adminToken))
      .send({
        clientId: seed.client.id,
        serviceTypeId: seed.serviceType.id,
        technicianIds: [seed.technician.id],
      })
      .expect(201);

    workOrderId = (woRes.body as { data: { id: string } }).data.id;

    const payRes = await request(app.getHttpServer())
      .post(`/work-orders/${workOrderId}/payments`)
      .set(authHeader(adminToken))
      .send({
        amount: 7500,
        method: 'cash',
        provider: 'cash',
        description: 'Pago en efectivo',
      })
      .expect(201);

    paymentId = (payRes.body as { data: { id: string } }).data.id;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('GET /reports/summary', () => {
    it('should return 200 with summary data', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/summary')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          kpis: Record<string, unknown>;
          monthlyTrend: Record<string, unknown>;
          workOrdersByStatus: unknown[];
          topServices: unknown[];
          paymentMethodDistribution: unknown[];
          topClients: unknown[];
          technicianPerformance: unknown[];
          workOrdersByPriority: unknown[];
          trends: Record<string, unknown>;
        };
      };

      expect(body.data.kpis).toBeDefined();
      expect(body.data.monthlyTrend).toBeDefined();
      expect(Array.isArray(body.data.workOrdersByStatus)).toBe(true);
      expect(Array.isArray(body.data.topServices)).toBe(true);
      expect(Array.isArray(body.data.paymentMethodDistribution)).toBe(true);
      expect(Array.isArray(body.data.topClients)).toBe(true);
      expect(Array.isArray(body.data.technicianPerformance)).toBe(true);
      expect(Array.isArray(body.data.workOrdersByPriority)).toBe(true);
      expect(body.data.trends).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer()).get('/reports/summary').expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/reports/summary')
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/income', () => {
    it('should return 200 with income data', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/income?period=monthly')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          period: { from: string; to: string; label: string };
          totalIncome: number;
          paymentCount: number;
          averageTicket: number;
          byMethod: unknown[];
          byDay: unknown[];
          previousPeriodTotal: number;
          changePercentage: number;
        };
      };

      expect(body.data.period).toBeDefined();
      expect(body.data.period.from).toBeDefined();
      expect(body.data.period.to).toBeDefined();
      expect(body.data.period.label).toBeDefined();
      expect(typeof body.data.totalIncome).toBe('number');
      expect(typeof body.data.paymentCount).toBe('number');
      expect(typeof body.data.averageTicket).toBe('number');
      expect(Array.isArray(body.data.byMethod)).toBe(true);
      expect(Array.isArray(body.data.byDay)).toBe(true);
      expect(typeof body.data.previousPeriodTotal).toBe('number');
      expect(typeof body.data.changePercentage).toBe('number');
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/reports/income?period=monthly')
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/reports/income?period=monthly')
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/expenses', () => {
    it('should return 200 with expense data', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/expenses?period=monthly')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          period: { from: string; to: string; label: string };
          totalExpenses: number;
          byCategory: unknown[];
          previousPeriodTotal: number;
          changePercentage: number;
        };
      };

      expect(body.data.period).toBeDefined();
      expect(typeof body.data.totalExpenses).toBe('number');
      expect(Array.isArray(body.data.byCategory)).toBe(true);
      expect(typeof body.data.previousPeriodTotal).toBe('number');
      expect(typeof body.data.changePercentage).toBe('number');
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/reports/expenses?period=monthly')
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/reports/expenses?period=monthly')
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/profit', () => {
    it('should return 200 with profit data', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/profit?period=monthly')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          period: { from: string; to: string; label: string };
          income: number;
          materialCosts: number;
          operationalExpenses: number;
          grossProfit: number;
          netProfit: number;
          workOrderCount: number;
          previousPeriodNetProfit: number;
          changePercentage: number;
        };
      };

      expect(body.data.period).toBeDefined();
      expect(typeof body.data.income).toBe('number');
      expect(typeof body.data.materialCosts).toBe('number');
      expect(typeof body.data.operationalExpenses).toBe('number');
      expect(typeof body.data.grossProfit).toBe('number');
      expect(typeof body.data.netProfit).toBe('number');
      expect(typeof body.data.workOrderCount).toBe('number');
      expect(typeof body.data.previousPeriodNetProfit).toBe('number');
      expect(typeof body.data.changePercentage).toBe('number');
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/reports/profit?period=monthly')
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/reports/profit?period=monthly')
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/services', () => {
    it('should return 200 with services data', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/services?period=monthly')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          period: { from: string; to: string; label: string };
          services: { name: string; count: number; revenue: number }[];
        };
      };

      expect(body.data.period).toBeDefined();
      expect(Array.isArray(body.data.services)).toBe(true);

      if (body.data.services.length > 0) {
        expect(body.data.services[0].name).toBeDefined();
        expect(typeof body.data.services[0].count).toBe('number');
        expect(typeof body.data.services[0].revenue).toBe('number');
      }
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/reports/services?period=monthly')
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/reports/services?period=monthly')
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/technicians', () => {
    it('should return 200 with technician ranking', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports/technicians')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          technicianId: string;
          name: string;
          completedOrders: number;
          averageResolutionDays: number;
          totalRevenue: number;
        }[];
      };

      expect(Array.isArray(body.data)).toBe(true);

      if (body.data.length > 0) {
        expect(body.data[0].technicianId).toBeDefined();
        expect(body.data[0].name).toBeDefined();
        expect(typeof body.data[0].completedOrders).toBe('number');
        expect(typeof body.data[0].averageResolutionDays).toBe('number');
        expect(typeof body.data[0].totalRevenue).toBe('number');
      }
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/reports/technicians')
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/reports/technicians')
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/technicians/:id', () => {
    it('should return 200 with technician detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/technicians/${seed.technician.id}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
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
            completedAt: string | null;
          }[];
        };
      };

      expect(body.data.technicianId).toBe(seed.technician.id);
      expect(body.data.name).toBeDefined();
      expect(typeof body.data.completedOrders).toBe('number');
      expect(typeof body.data.inProgressOrders).toBe('number');
      expect(typeof body.data.averageResolutionDays).toBe('number');
      expect(typeof body.data.totalRevenue).toBe('number');
      expect(Array.isArray(body.data.recentOrders)).toBe(true);
    });

    it('should return 404 for non-existent technician', async () => {
      await request(app.getHttpServer())
        .get('/reports/technicians/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/reports/technicians/${seed.technician.id}`)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get(`/reports/technicians/${seed.technician.id}`)
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/clients/:id', () => {
    it('should return 200 with client report', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/clients/${seed.client.id}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          client: {
            id: string;
            name: string;
            email: string;
            phone: string;
            address: string;
          };
          kpis: {
            totalWorkOrders: number;
            completedOrders: number;
            totalSpent: number;
            outstandingDebt: number;
            averageTicket: number;
            lastServiceDate: string | null;
            isRecurrent: boolean;
          };
          workOrders: unknown[];
          paymentHistory: unknown[];
        };
      };

      expect(body.data.client).toBeDefined();
      expect(body.data.client.id).toBe(seed.client.id);
      expect(body.data.client.name).toBeDefined();
      expect(body.data.kpis).toBeDefined();
      expect(typeof body.data.kpis.totalWorkOrders).toBe('number');
      expect(typeof body.data.kpis.totalSpent).toBe('number');
      expect(Array.isArray(body.data.workOrders)).toBe(true);
      expect(Array.isArray(body.data.paymentHistory)).toBe(true);
    });

    it('should return 404 for non-existent client', async () => {
      await request(app.getHttpServer())
        .get('/reports/clients/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/reports/clients/${seed.client.id}`)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get(`/reports/clients/${seed.client.id}`)
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/work-orders/:id/budget', () => {
    it('should return 200 with PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/work-orders/${workOrderId}/budget`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('presupuesto-');
    });

    it('should return 404 for non-existent work order', async () => {
      await request(app.getHttpServer())
        .get('/reports/work-orders/00000000-0000-0000-0000-000000000000/budget')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/reports/work-orders/${workOrderId}/budget`)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get(`/reports/work-orders/${workOrderId}/budget`)
        .set(authHeader(techToken))
        .expect(403);
    });
  });

  describe('GET /reports/payments/:id/receipt', () => {
    it('should return 200 with PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reports/payments/${paymentId}/receipt`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('comprobante-');
    });

    it('should return 404 for non-existent payment', async () => {
      await request(app.getHttpServer())
        .get('/reports/payments/00000000-0000-0000-0000-000000000000/receipt')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/reports/payments/${paymentId}/receipt`)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get(`/reports/payments/${paymentId}/receipt`)
        .set(authHeader(techToken))
        .expect(403);
    });
  });
});
