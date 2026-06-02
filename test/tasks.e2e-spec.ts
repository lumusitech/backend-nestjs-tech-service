import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

interface TaskResponse {
  data: {
    id: string;
    title: string;
    description: string | null;
    isCompleted: boolean;
    completedAt: string | null;
    assignedToId: string | null;
    workOrderId: string;
  };
}

interface TaskListResponse {
  data: TaskResponse['data'][];
}

interface WorkOrderResponse {
  data: { id: string };
}

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let seed: SeedData;
  let workOrderId: string;

  beforeAll(async () => {
    app = await createTestApp();
    seed = await seedTestData(app);
    token = await loginAsAdmin(app);

    const res = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(token))
      .send({
        clientId: seed.client.id,
        serviceTypeId: seed.serviceType.id,
      })
      .expect(201);

    const body = res.body as WorkOrderResponse;
    workOrderId = body.data.id;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /work-orders/:id/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Replace screen' })
        .expect(201);

      const body = res.body as TaskResponse;

      expect(body.data.id).toBeDefined();
      expect(body.data.title).toBe('Replace screen');
      expect(body.data.isCompleted).toBe(false);
    });

    it('should create a task with optional fields', async () => {
      const res = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({
          title: 'Test battery',
          description: 'Check battery health',
          assignedToId: seed.technician.id,
        })
        .expect(201);

      const body = res.body as TaskResponse;

      expect(body.data.description).toBe('Check battery health');
      expect(body.data.assignedToId).toBe(seed.technician.id);
    });

    it('should fail without title', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({})
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .send({ title: 'Unauthorized task' })
        .expect(401);
    });
  });

  describe('GET /work-orders/:id/tasks', () => {
    it('should list tasks for a work order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .expect(200);

      const body = res.body as TaskListResponse;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for work order with no tasks', async () => {
      const woRes = await request(app.getHttpServer())
        .post('/work-orders')
        .set(authHeader(token))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const woBody = woRes.body as WorkOrderResponse;
      const emptyId = woBody.data.id;

      const res = await request(app.getHttpServer())
        .get(`/work-orders/${emptyId}/tasks`)
        .set(authHeader(token))
        .expect(200);

      const body = res.body as TaskListResponse;

      expect(body.data).toEqual([]);
    });
  });

  describe('PATCH /work-orders/:id/tasks/:taskId', () => {
    it('should update a task', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Task to update' })
        .expect(201);

      const created = createRes.body as TaskResponse;
      const taskId = created.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${workOrderId}/tasks/${taskId}`)
        .set(authHeader(token))
        .send({ title: 'Updated task title' })
        .expect(200);

      const body = res.body as TaskResponse;

      expect(body.data.title).toBe('Updated task title');
    });

    it('should mark a task as completed', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Task to complete' })
        .expect(201);

      const created = createRes.body as TaskResponse;
      const taskId = created.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${workOrderId}/tasks/${taskId}`)
        .set(authHeader(token))
        .send({ isCompleted: true, completedAt: new Date().toISOString() })
        .expect(200);

      const body = res.body as TaskResponse;

      expect(body.data.isCompleted).toBe(true);
      expect(body.data.completedAt).toBeDefined();
    });

    it('should assign task to a technician', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Task to assign' })
        .expect(201);

      const created = createRes.body as TaskResponse;
      const taskId = created.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/work-orders/${workOrderId}/tasks/${taskId}`)
        .set(authHeader(token))
        .send({ assignedToId: seed.technician.id })
        .expect(200);

      const body = res.body as TaskResponse;

      expect(body.data.assignedToId).toBe(seed.technician.id);
    });
  });

  describe('DELETE /work-orders/:id/tasks/:taskId', () => {
    it('should delete a task', async () => {
      const createRes = await request(app.getHttpServer())
        .post(`/work-orders/${workOrderId}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Task to delete' })
        .expect(201);

      const created = createRes.body as TaskResponse;
      const taskId = created.data.id;

      await request(app.getHttpServer())
        .delete(`/work-orders/${workOrderId}/tasks/${taskId}`)
        .set(authHeader(token))
        .expect(200);
    });

    it('should fail to delete non-existent task', async () => {
      await request(app.getHttpServer())
        .delete(
          `/work-orders/${workOrderId}/tasks/00000000-0000-0000-0000-000000000000`,
        )
        .set(authHeader(token))
        .expect(404);
    });
  });
});
