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

interface PendingItemData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  type: string;
  priority: string;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  assignedToId: string | null;
  createdById: string;
  completedAt: string | null;
}

interface PendingItemListResponse {
  data: {
    data: PendingItemData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

describe('PendingItems (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let technicianToken: string;
  let seed: SeedData;
  let pendingItemId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);
    technicianToken = await loginAsTechnician(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /pending-items', () => {
    it('should create a pending item as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/pending-items')
        .set(authHeader(adminToken))
        .send({
          title: 'Revisar garantía de repuesto',
          description: 'Verificar si el repuesto aún tiene garantía',
          dueDate: '2026-07-15',
          type: 'maintenance',
          priority: 'high',
        })
        .expect(201);

      const body = res.body as { data: PendingItemData };
      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBe('Revisar garantía de repuesto');
      expect(body.data.type).toBe('maintenance');
      expect(body.data.priority).toBe('high');
      expect(body.data.status).toBe('pending');
      expect(body.data.createdById).toBeDefined();
      pendingItemId = body.data.id;
    });

    it('should create a pending item as technician (work_order only)', async () => {
      const res = await request(app.getHttpServer())
        .post('/pending-items')
        .set(authHeader(technicianToken))
        .send({
          title: 'Verificar fuente de poder',
          dueDate: '2026-07-10',
          type: 'work_order',
          referenceType: 'work_order',
          referenceId: seed.client.id,
        })
        .expect(201);

      const body = res.body as { data: PendingItemData };
      expect(body.data.type).toBe('work_order');
      expect(body.data.referenceType).toBe('work_order');
      expect(body.data.assignedToId).toBeDefined();
    });

    it('should fail technician creating non-work_order type', async () => {
      await request(app.getHttpServer())
        .post('/pending-items')
        .set(authHeader(technicianToken))
        .send({
          title: 'Invalid for tech',
          dueDate: '2026-07-10',
          type: 'maintenance',
        })
        .expect(400);
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/pending-items')
        .set(authHeader(adminToken))
        .send({
          title: 'Incomplete',
        })
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/pending-items')
        .send({
          title: 'No Auth',
          dueDate: '2026-07-10',
          type: 'other',
        })
        .expect(401);
    });
  });

  describe('GET /pending-items', () => {
    it('should list pending items as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/pending-items')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as PendingItemListResponse;
      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data.total).toBeDefined();
      expect(body.data.page).toBeDefined();
      expect(body.data.limit).toBeDefined();
      expect(body.data.totalPages).toBeDefined();
    });

    it('should list pending items as technician', async () => {
      const res = await request(app.getHttpServer())
        .get('/pending-items')
        .set(authHeader(technicianToken))
        .expect(200);

      const body = res.body as PendingItemListResponse;
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/pending-items?status=pending')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as PendingItemListResponse;
      body.data.data.forEach((item) => {
        expect(item.status).toBe('pending');
      });
    });

    it('should filter by priority', async () => {
      const res = await request(app.getHttpServer())
        .get('/pending-items?priority=high')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as PendingItemListResponse;
      body.data.data.forEach((item) => {
        expect(item.priority).toBe('high');
      });
    });

    it('should filter by type', async () => {
      const res = await request(app.getHttpServer())
        .get('/pending-items?type=maintenance')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as PendingItemListResponse;
      body.data.data.forEach((item) => {
        expect(item.type).toBe('maintenance');
      });
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/pending-items?page=1&limit=1')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as PendingItemListResponse;
      expect(body.data.data.length).toBeLessThanOrEqual(1);
      expect(body.data.limit).toBe(1);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer()).get('/pending-items').expect(401);
    });
  });

  describe('GET /pending-items/:id', () => {
    it('should return a single pending item', async () => {
      const res = await request(app.getHttpServer())
        .get(`/pending-items/${pendingItemId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: PendingItemData };
      expect(body.data.id).toBe(pendingItemId);
      expect(body.data.title).toBe('Revisar garantía de repuesto');
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/pending-items/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/pending-items/not-a-uuid')
        .set(authHeader(adminToken))
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .get(`/pending-items/${pendingItemId}`)
        .expect(401);
    });
  });

  describe('PATCH /pending-items/:id', () => {
    it('should update a pending item', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/pending-items/${pendingItemId}`)
        .set(authHeader(adminToken))
        .send({ title: 'Updated title', priority: 'urgent' })
        .expect(200);

      const body = res.body as { data: PendingItemData };
      expect(body.data.title).toBe('Updated title');
      expect(body.data.priority).toBe('urgent');
    });

    it('should mark as completed', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/pending-items/${pendingItemId}`)
        .set(authHeader(adminToken))
        .send({ status: 'completed' })
        .expect(200);

      const body = res.body as { data: PendingItemData };
      expect(body.data.status).toBe('completed');
      expect(body.data.completedAt).toBeDefined();
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/pending-items/${pendingItemId}`)
        .send({ title: 'No Auth' })
        .expect(401);
    });

    it('should fail with technician role (admin only)', async () => {
      await request(app.getHttpServer())
        .patch(`/pending-items/${pendingItemId}`)
        .set(authHeader(technicianToken))
        .send({ title: 'Tech update' })
        .expect(403);
    });
  });

  describe('DELETE /pending-items/:id', () => {
    it('should soft delete a pending item', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/pending-items')
        .set(authHeader(adminToken))
        .send({
          title: 'To Delete',
          dueDate: '2026-07-20',
          type: 'other',
        })
        .expect(201);

      const deleteId = (createRes.body as { data: PendingItemData }).data.id;

      await request(app.getHttpServer())
        .delete(`/pending-items/${deleteId}`)
        .set(authHeader(adminToken))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/pending-items/${deleteId}`)
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .delete('/pending-items/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/pending-items/${pendingItemId}`)
        .expect(401);
    });

    it('should fail with technician role (admin only)', async () => {
      await request(app.getHttpServer())
        .delete(`/pending-items/${pendingItemId}`)
        .set(authHeader(technicianToken))
        .expect(403);
    });
  });
});
