import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import {
  authHeader,
  loginAsAdmin,
  loginAsTechnician,
} from './helpers/auth.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let technicianToken: string;
  let seed: SeedData;

  beforeAll(async () => {
    app = await createTestApp();
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);
    technicianToken = await loginAsTechnician(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a user as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(adminToken))
        .send({
          name: 'New User',
          email: 'new.user@test.com',
          password: 'password123',
          role: 'technician',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe('new.user@test.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'X', email: 'x@test.com', password: 'pass123' })
        .expect(401);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(technicianToken))
        .send({ name: 'X', email: 'x2@test.com', password: 'pass123' })
        .expect(403);
    });
  });

  describe('GET /users', () => {
    it('should list users as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set(authHeader(adminToken))
        .expect(200);

      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by role', async () => {
      const res = await request(app.getHttpServer())
        .get('/users?role=technician')
        .set(authHeader(adminToken))
        .expect(200);

      const users = res.body.data.data as { role: string }[];
      expect(users.length).toBeGreaterThan(0);
      expect(users.every((u) => u.role === 'technician')).toBe(true);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set(authHeader(technicianToken))
        .expect(403);
    });
  });

  describe('GET /users/:id', () => {
    it('should get a user by id as admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${seed.admin.id}`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.body.data.id).toBe(seed.admin.id);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-4000-8000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${seed.technician.id}`)
        .set(authHeader(adminToken))
        .send({ name: 'Updated Technician' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Technician');
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${seed.technician.id}`)
        .set(authHeader(technicianToken))
        .send({ name: 'Hack' })
        .expect(403);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should soft delete a user as admin', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set(authHeader(adminToken))
        .send({
          name: 'To Delete',
          email: 'to.delete@test.com',
          password: 'password123',
          role: 'technician',
        })
        .expect(201);

      const userId = createRes.body.data.id as string;

      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set(authHeader(adminToken))
        .expect(200);
    });
  });
});
