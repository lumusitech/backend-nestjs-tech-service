import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

describe('Suppliers (e2e)', () => {
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

  describe('POST /suppliers', () => {
    it('should create a supplier', async () => {
      const dto = {
        name: 'New Supplier',
        contact: 'John Doe',
        phone: '+54 11 3333-3333',
        email: 'new@test.com',
        address: 'New Address 789',
      };

      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .set(authHeader(token))
        .send(dto)
        .expect(201);

      expect(res.body.data).toMatchObject({
        name: dto.name,
        contact: dto.contact,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        isActive: true,
      });
      expect(res.body.data.id).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .send({ name: 'X', contact: 'Y', phone: 'Z', address: 'W' })
        .expect(401);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .set(authHeader(token))
        .send({ name: 'Incomplete' })
        .expect(400);
    });
  });

  describe('GET /suppliers', () => {
    it('should return paginated suppliers', async () => {
      const res = await request(app.getHttpServer())
        .get('/suppliers')
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
      await request(app.getHttpServer()).get('/suppliers').expect(401);
    });
  });

  describe('GET /suppliers/:id', () => {
    it('should return a single supplier', async () => {
      const res = await request(app.getHttpServer())
        .get(`/suppliers/${seed.supplier.id}`)
        .set(authHeader(token))
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: seed.supplier.id,
        name: seed.supplier.name,
      });
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/suppliers/${seed.supplier.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .get('/suppliers/00000000-0000-0000-0000-000000000000')
        .set(authHeader(token))
        .expect(404);
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/suppliers/not-a-uuid')
        .set(authHeader(token))
        .expect(400);
    });
  });

  describe('PATCH /suppliers/:id', () => {
    it('should update a supplier', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/suppliers/${seed.supplier.id}`)
        .set(authHeader(token))
        .send({ name: 'Updated Supplier' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Supplier');
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/suppliers/${seed.supplier.id}`)
        .send({ name: 'X' })
        .expect(401);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .patch('/suppliers/00000000-0000-0000-0000-000000000000')
        .set(authHeader(token))
        .send({ name: 'X' })
        .expect(404);
    });
  });

  describe('DELETE /suppliers/:id', () => {
    it('should soft delete a supplier', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/suppliers')
        .set(authHeader(token))
        .send({
          name: 'To Delete',
          contact: 'Contact',
          phone: '+54 11 9999-9999',
          address: 'Delete Address',
        })
        .expect(201);

      const id = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/suppliers/${id}`)
        .set(authHeader(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/suppliers/${id}`)
        .set(authHeader(token))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/suppliers/${seed.supplier.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent id', async () => {
      await request(app.getHttpServer())
        .delete('/suppliers/00000000-0000-0000-0000-000000000000')
        .set(authHeader(token))
        .expect(404);
    });
  });
});
