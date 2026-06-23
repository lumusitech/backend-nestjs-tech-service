import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

interface WorkOrderResponse {
  data: {
    id: string;
    trackingCode: string;
    status: string;
    priority: string;
    location: string;
    diagnosis: string | null;
    clientId: string;
    serviceTypeId: string;
    client?: { id: string; name: string };
    serviceType?: { id: string; name: string };
    technicians?: { id: string }[];
  };
}

interface WorkOrderListResponse {
  data: {
    data: WorkOrderResponse['data'][];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

describe('WorkOrders (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let seed: SeedData;

  beforeAll(async () => {
    app = await createTestApp();
    seed = await seedTestData(app);
    token = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /work-orders', () => {
    it('should create a work order', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const body = res.body as WorkOrderResponse;

      expect(body.data.id).toBeDefined();
      expect(body.data.trackingCode).toBeDefined();
      expect(body.data.status).toBe('pending');
      expect(body.data.clientId).toBe(seed.client.id);
      expect(body.data.serviceTypeId).toBe(seed.serviceType.id);
    });

    it('should create a work order with optional fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
          priority: 'high',
          location: 'on_site',
          diagnosis: 'Screen broken',
          scheduledDate: '2026-06-10',
        })
        .expect(201);

      const body = res.body as WorkOrderResponse;

      expect(body.data.priority).toBe('high');
      expect(body.data.location).toBe('on_site');
      expect(body.data.diagnosis).toBe('Screen broken');
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({})
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/work-orders')
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(401);
    });
  });

  describe('GET /work-orders', () => {
    it('should return paginated work orders', async () => {
      const res = await request(app.getHttpServer())
        .get('/work-orders')
        .set(authHeader(token))
        .expect(200);

      const body = res.body as WorkOrderListResponse;

      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.total).toBeDefined();
      expect(body.data.page).toBeDefined();
      expect(body.data.limit).toBeDefined();
      expect(body.data.totalPages).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/work-orders?status=pending')
        .set(authHeader(token))
        .expect(200);

      const body = res.body as WorkOrderListResponse;

      body.data.data.forEach((wo) => {
        expect(wo.status).toBe('pending');
      });
    });

    it('should filter by clientId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/work-orders?clientId=${seed.client.id}`)
        .set(authHeader(token))
        .expect(200);

      const body = res.body as WorkOrderListResponse;

      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('should support pagination params', async () => {
      const res = await request(app.getHttpServer())
        .get('/work-orders?page=1&limit=5')
        .set(authHeader(token))
        .expect(200);

      const body = res.body as WorkOrderListResponse;

      expect(body.data.total).toBeDefined();
    });
  });

  describe('GET /work-orders/:id', () => {
    it('should return a work order with relations', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const created = createRes.body as WorkOrderResponse;
      const id = created.data.id;

      const res = await request(app.getHttpServer())
        .get(`/work-orders/${id}`)
        .set(authHeader(token))
        .expect(200);

      const body = res.body as WorkOrderResponse;

      expect(body.data.id).toBe(id);
      expect(body.data.client).toBeDefined();
      expect(body.data.serviceType).toBeDefined();
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/work-orders/invalid-uuid')
        .set(authHeader(token))
        .expect(400);
    });
  });

  describe('PATCH /work-orders/:id', () => {
    it('should update work order fields', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const created = createRes.body as WorkOrderResponse;
      const id = created.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .set(authHeader(token))
        .send({ diagnosis: 'Updated diagnosis', priority: 'urgent' })
        .expect(200);

      const body = res.body as WorkOrderResponse;

      expect(body.data.diagnosis).toBe('Updated diagnosis');
      expect(body.data.priority).toBe('urgent');
    });

    it('should change status', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const created = createRes.body as WorkOrderResponse;
      const id = created.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${id}`)
        .set(authHeader(token))
        .send({ status: 'assigned' })
        .expect(200);

      const body = res.body as WorkOrderResponse;

      expect(body.data.status).toBe('assigned');
    });
  });

  describe('DELETE /work-orders/:id', () => {
    it('should soft delete a work order', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const created = createRes.body as WorkOrderResponse;
      const id = created.data.id;

      await request(app.getHttpServer())
        .delete(`/work-orders/${id}`)
        .set(authHeader(token))
        .expect(200);
    });
  });

  describe('PUT /work-orders/:id/technicians', () => {
    it('should assign technicians to a work order', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const created = createRes.body as WorkOrderResponse;
      const id = created.data.id;

      const res = await request(app.getHttpServer())
        .put(`/work-orders/${id}/technicians`)
        .set(authHeader(token))
        .send({ technicianIds: [seed.technician.id] })
        .expect(200);

      const body = res.body as WorkOrderResponse;

      expect(body.data).toBeDefined();
    });

    it('should replace technicians list', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
          technicianIds: [seed.technician.id],
        })
        .expect(201);

      const created = createRes.body as WorkOrderResponse;
      const id = created.data.id;

      await request(app.getHttpServer())
        .put(`/work-orders/${id}/technicians`)
        .set(authHeader(token))
        .send({ technicianIds: [] })
        .expect(200);
    });
  });
});
