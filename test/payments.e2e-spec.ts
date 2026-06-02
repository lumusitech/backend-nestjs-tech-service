import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

describe('Payments (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let seed: SeedData;
  let workOrderId: string;
  let cashPaymentId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);

    const res = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(adminToken))
      .send({
        clientId: seed.client.id,
        serviceTypeId: seed.serviceType.id,
        technicianIds: [seed.technician.id],
      })
      .expect(201);

    workOrderId = (res.body as { data: { id: string } }).data.id;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /work-orders/:workOrderId/payments', () => {
    it('should create a cash payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/payments`)
        .set(authHeader(adminToken))
        .send({
          amount: 5000,
          method: 'cash',
          provider: 'cash',
          description: 'Pago en efectivo',
        })
        .expect(201);

      const body = res.body as {
        data: { id: string; amount: number; status: string; method: string };
      };
      expect(body.data.id).toBeDefined();
      expect(body.data.amount).toBe(5000);
      expect(body.data.status).toBe('approved');
      expect(body.data.method).toBe('cash');
      cashPaymentId = body.data.id;
    });

    it('should create a transfer payment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/payments`)
        .set(authHeader(adminToken))
        .send({
          amount: 3000,
          method: 'transfer',
          provider: 'transfer',
          description: 'Transferencia bancaria',
        })
        .expect(201);

      const body = res.body as { data: { id: string; method: string } };
      expect(body.data.method).toBe('transfer');
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/payments`)
        .send({
          amount: 1000,
          method: 'cash',
          provider: 'cash',
        })
        .expect(403);
    });

    it('should fail with invalid amount', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/payments`)
        .set(authHeader(adminToken))
        .send({
          amount: -5,
          method: 'cash',
          provider: 'cash',
        })
        .expect(400);
    });

    it('should fail with unknown provider', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/payments`)
        .set(authHeader(adminToken))
        .send({
          amount: 1000,
          method: 'cash',
          provider: 'unknown_provider',
        })
        .expect(400);
    });
  });

  describe('GET /work-orders/:workOrderId/payments', () => {
    it('should list payments for a work order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/work-orders/${workOrderId}/payments`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { data: unknown[]; total: number } };
      expect(body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter payments by status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/work-orders/${workOrderId}/payments?status=approved`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { data: { status: string }[] } };
      body.data.data.forEach((p) => {
        expect(p.status).toBe('approved');
      });
    });

    it('should filter payments by method', async () => {
      const res = await request(app.getHttpServer())
        .get(`/work-orders/${workOrderId}/payments?method=cash`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { data: { method: string }[] } };
      body.data.data.forEach((p) => {
        expect(p.method).toBe('cash');
      });
    });
  });

  describe('GET /work-orders/:workOrderId/payments/:id', () => {
    it('should get a single payment', async () => {
      const res = await request(app.getHttpServer())
        .get(`/work-orders/${workOrderId}/payments/${cashPaymentId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: { id: string } };
      expect(body.data.id).toBe(cashPaymentId);
    });

    it('should return 404 for non-existent payment', async () => {
      await request(app.getHttpServer())
        .get(
          `/work-orders/${workOrderId}/payments/00000000-0000-0000-0000-000000000000`,
        )
        .set(authHeader(adminToken))
        .expect(404);
    });
  });

  describe('PATCH /work-orders/:workOrderId/payments/:id', () => {
    it('should update payment status', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${workOrderId}/payments/${cashPaymentId}`)
        .set(authHeader(adminToken))
        .send({ status: 'refunded' })
        .expect(200);

      const body = res.body as { data: { status: string } };
      expect(body.data.status).toBe('refunded');
    });

    it('should update payment description', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${workOrderId}/payments/${cashPaymentId}`)
        .set(authHeader(adminToken))
        .send({ description: 'Descripcion actualizada' })
        .expect(200);

      const body = res.body as { data: { description: string } };
      expect(body.data.description).toBe('Descripcion actualizada');
    });
  });

  describe('POST /payments/mercadopago/webhook', () => {
    it('should accept webhook without auth (public)', async () => {
      await request(app.getHttpServer())
        .post('/payments/mercadopago/webhook')
        .send({
          type: 'payment',
          action: 'payment.updated',
          data: { id: '99999999' },
        })
        .expect(200);
    });
  });
});
