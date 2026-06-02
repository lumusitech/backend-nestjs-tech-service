import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

describe('Finances (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let expenseId: string;
  let recurringExpenseId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    await seedTestData(app);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /expenses', () => {
    it('should create an expense', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set(authHeader(adminToken))
        .send({
          description: 'Alquiler oficina',
          amount: 150000,
          date: '2025-06-01',
          category: 'rent',
          isRecurring: true,
          notes: 'Pago mensual',
        })
        .expect(201);

      const body = res.body as {
        data: {
          id: string;
          description: string;
          amount: number;
          category: string;
          isRecurring: boolean;
        };
      };
      expect(body.data.id).toBeDefined();
      expect(body.data.description).toBe('Alquiler oficina');
      expect(body.data.amount).toBe(150000);
      expect(body.data.category).toBe('rent');
      expect(body.data.isRecurring).toBe(true);
      recurringExpenseId = body.data.id;
    });

    it('should create a non-recurring expense', async () => {
      const res = await request(app.getHttpServer())
        .post('/expenses')
        .set(authHeader(adminToken))
        .send({
          description: 'Compra de herramientas',
          amount: 25000,
          date: '2025-06-15',
          category: 'tools',
        })
        .expect(201);

      const body = res.body as {
        data: { id: string; isRecurring: boolean };
      };
      expect(body.data.isRecurring).toBe(false);
      expenseId = body.data.id;
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/expenses')
        .send({
          description: 'Test',
          amount: 100,
          date: '2025-06-01',
          category: 'other',
        })
        .expect(403);
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/expenses')
        .set(authHeader(adminToken))
        .send({
          description: 'Incomplete',
        })
        .expect(400);
    });

    it('should fail with invalid category', async () => {
      await request(app.getHttpServer())
        .post('/expenses')
        .set(authHeader(adminToken))
        .send({
          description: 'Bad category',
          amount: 100,
          date: '2025-06-01',
          category: 'invalid_category',
        })
        .expect(400);
    });
  });

  describe('GET /expenses', () => {
    it('should list all expenses', async () => {
      const res = await request(app.getHttpServer())
        .get('/expenses')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { data: unknown[]; total: number } };
      expect(body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter by category', async () => {
      const res = await request(app.getHttpServer())
        .get('/expenses?category=rent')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { data: { category: string }[] } };
      body.data.data.forEach((e) => {
        expect(e.category).toBe('rent');
      });
    });

    it('should filter by date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/expenses?dateFrom=2025-06-01&dateTo=2025-06-30')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { data: unknown[] } };
      expect(body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by isRecurring', async () => {
      const res = await request(app.getHttpServer())
        .get('/expenses?isRecurring=true')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: { data: { isRecurring: boolean }[] };
      };
      body.data.data.forEach((e) => {
        expect(e.isRecurring).toBe(true);
      });
    });
  });

  describe('GET /expenses/:id', () => {
    it('should get a single expense', async () => {
      const res = await request(app.getHttpServer())
        .get(`/expenses/${expenseId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { id: string } };
      expect(body.data.id).toBe(expenseId);
    });

    it('should return 404 for non-existent expense', async () => {
      await request(app.getHttpServer())
        .get('/expenses/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });
  });

  describe('PATCH /expenses/:id', () => {
    it('should update an expense', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expenseId}`)
        .set(authHeader(adminToken))
        .send({ description: 'Herramientas actualizadas', amount: 30000 })
        .expect(200);

      const body = res.body as {
        data: { description: string; amount: number };
      };
      expect(body.data.description).toBe('Herramientas actualizadas');
      expect(body.data.amount).toBe(30000);
    });

    it('should update category', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/expenses/${expenseId}`)
        .set(authHeader(adminToken))
        .send({ category: 'supplies' })
        .expect(200);

      const body = res.body as { data: { category: string } };
      expect(body.data.category).toBe('supplies');
    });
  });

  describe('DELETE /expenses/:id', () => {
    it('should soft delete an expense', async () => {
      await request(app.getHttpServer())
        .delete(`/expenses/${recurringExpenseId}`)
        .set(authHeader(adminToken))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/expenses/${recurringExpenseId}`)
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 404 when deleting non-existent expense', async () => {
      await request(app.getHttpServer())
        .delete('/expenses/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });
  });
});
