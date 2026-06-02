import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

describe('ServiceTypes (e2e)', () => {
  let app: INestApplication<App>;
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

  describe('POST /service-types', () => {
    it('should create a service type', async () => {
      const dto = {
        name: 'Instalación de Cámaras',
        description: 'Instalación de sistema de cámaras de seguridad',
        estimatedDuration: 180,
      };

      const res = await request(app.getHttpServer())
        .post('/service-types')
        .set(authHeader(token))
        .send(dto)
        .expect(201);

      expect(res.body.data).toMatchObject({
        name: dto.name,
        description: dto.description,
        estimatedDuration: dto.estimatedDuration,
        isActive: true,
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 409 for duplicate name', async () => {
      await request(app.getHttpServer())
        .post('/service-types')
        .set(authHeader(token))
        .send({
          name: seed.serviceType.name,
          description: 'Duplicate',
        })
        .expect(409);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/service-types')
        .send({ name: 'Unauthorized' })
        .expect(401);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/service-types')
        .set(authHeader(token))
        .send({ description: 'No name' })
        .expect(400);
    });
  });

  describe('GET /service-types', () => {
    it('should return paginated service types', async () => {
      const res = await request(app.getHttpServer())
        .get('/service-types')
        .set(authHeader(token))
        .expect(200);

      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('page');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer()).get('/service-types').expect(401);
    });
  });

  describe('GET /service-types/:id', () => {
    it('should return a single service type', async () => {
      const res = await request(app.getHttpServer())
        .get(`/service-types/${seed.serviceType.id}`)
        .set(authHeader(token))
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: seed.serviceType.id,
        name: seed.serviceType.name,
      });
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/service-types/${seed.serviceType.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/service-types/00000000-0000-0000-0000-000000000000')
        .set(authHeader(token))
        .expect(404);
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/service-types/not-a-uuid')
        .set(authHeader(token))
        .expect(400);
    });
  });

  describe('PATCH /service-types/:id', () => {
    it('should update a service type', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/service-types/${seed.serviceType.id}`)
        .set(authHeader(token))
        .send({ name: 'Reparación Actualizada' })
        .expect(200);

      expect(res.body.data.name).toBe('Reparación Actualizada');
    });

    it('should return 409 when updating to a duplicate name', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/service-types')
        .set(authHeader(token))
        .send({ name: 'Unique Type' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/service-types/${createRes.body.data.id}`)
        .set(authHeader(token))
        .send({ name: 'Reparación Actualizada' })
        .expect(409);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/service-types/${seed.serviceType.id}`)
        .send({ name: 'X' })
        .expect(401);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/service-types/00000000-0000-0000-0000-000000000000')
        .set(authHeader(token))
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('DELETE /service-types/:id', () => {
    it('should soft delete a service type', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/service-types')
        .set(authHeader(token))
        .send({ name: 'To Delete' })
        .expect(201);

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/service-types/${id}`)
        .set(authHeader(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/service-types/${id}`)
        .set(authHeader(token))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/service-types/${seed.serviceType.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/service-types/00000000-0000-0000-0000-000000000000')
        .set(authHeader(token))
        .expect(404);
    });
  });
});
