import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Client } from '../src/clients/entities/client.entity';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import {
  authHeader,
  loginAsAdmin,
  loginAsTechnician,
} from './helpers/auth.helper';

describe('Clients (e2e)', () => {
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

  describe('POST /clients', () => {
    it('should create a client as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/clients')
        .set(authHeader(adminToken))
        .send({
          name: 'New Client',
          email: 'newclient@test.com',
          phone: '+54 11 3333-3333',
          address: 'New Address 789',
        })
        .expect(201);

      const body = res.body as {
        data: {
          id: string;
          name: string;
          email: string;
          phone: string;
          address: string;
          isActive: boolean;
        };
      };
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe('New Client');
      expect(body.data.email).toBe('newclient@test.com');
      expect(body.data.phone).toBe('+54 11 3333-3333');
      expect(body.data.address).toBe('New Address 789');
      expect(body.data.isActive).toBe(true);
    });

    it('should return 409 when creating a client with duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/clients')
        .set(authHeader(adminToken))
        .send({
          name: 'Duplicate Client',
          email: 'client@test.com',
          phone: '+54 11 4444-4444',
          address: 'Dup Address',
        })
        .expect(409);

      expect((res.body as { message: string }).message).toBe(
        'Email already exists',
      );
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/clients')
        .send({
          name: 'No Auth Client',
          email: 'noauth@test.com',
          phone: '+54 11 5555-5555',
          address: 'No Auth Address',
        })
        .expect(401);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .post('/clients')
        .set(authHeader(technicianToken))
        .send({
          name: 'Tech Client',
          email: 'techclient@test.com',
          phone: '+54 11 6666-6666',
          address: 'Tech Address',
        })
        .expect(403);
    });
  });

  describe('GET /clients', () => {
    it('should list clients with pagination as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/clients')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: {
          data: unknown[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
      expect(body.data.data).toBeDefined();
      expect(body.data.total).toBeDefined();
      expect(body.data.page).toBeDefined();
      expect(body.data.limit).toBeDefined();
      expect(body.data.totalPages).toBeDefined();
      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/clients?page=1&limit=1')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: { data: unknown[]; limit: number; page: number };
      };
      expect(body.data.data.length).toBeLessThanOrEqual(1);
      expect(body.data.limit).toBe(1);
      expect(body.data.page).toBe(1);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer()).get('/clients').expect(401);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .get('/clients')
        .set(authHeader(technicianToken))
        .expect(403);
    });

    describe('date range filters', () => {
      let dataSource: DataSource;

      beforeAll(() => {
        dataSource = app.get(DataSource);
      });

      async function createDatedClient(name: string, createdAt: string) {
        const repo = dataSource.getRepository(Client);
        return repo.save(
          repo.create({
            name,
            email: `${name.replace(/\s+/g, '.').toLowerCase()}@test.com`,
            phone: '+54 11 3333-3333',
            address: 'Date Filter Address',
            createdAt,
          }),
        );
      }

      it('should include records from the selected dateTo day (midnight boundary)', async () => {
        await createDatedClient('Midnight Boundary Client', '2026-01-15T10:30:00.000Z');

        const res = await request(app.getHttpServer())
          .get('/clients?dateFrom=2026-01-15&dateTo=2026-01-15')
          .set(authHeader(adminToken))
          .expect(200);

        const names = (res.body.data.data as { name: string }[]).map(
          (c) => c.name,
        );
        expect(names).toContain('Midnight Boundary Client');
      });

      it('should exclude records before dateFrom', async () => {
        const res = await request(app.getHttpServer())
          .get('/clients?dateFrom=2026-02-01')
          .set(authHeader(adminToken))
          .expect(200);

        const names = (res.body.data.data as { name: string }[]).map(
          (c) => c.name,
        );
        expect(names).not.toContain('Midnight Boundary Client');
      });

      it('should exclude records after dateTo', async () => {
        const res = await request(app.getHttpServer())
          .get('/clients?dateTo=2026-01-14')
          .set(authHeader(adminToken))
          .expect(200);

        const names = (res.body.data.data as { name: string }[]).map(
          (c) => c.name,
        );
        expect(names).not.toContain('Midnight Boundary Client');
      });

      it('should return 400 when dateFrom is after dateTo', async () => {
        await request(app.getHttpServer())
          .get('/clients?dateFrom=2026-12-31&dateTo=2026-01-01')
          .set(authHeader(adminToken))
          .expect(400);
      });
    });

    describe('isActive filter', () => {
      let dataSource: DataSource;

      beforeAll(() => {
        dataSource = app.get(DataSource);
      });

      async function createInactiveClient() {
        const repo = dataSource.getRepository(Client);
        return repo.save(
          repo.create({
            name: 'Inactive Filter Client',
            email: 'inactive.filter@test.com',
            phone: '+54 11 4444-4444',
            address: 'Inactive Address',
            isActive: false,
          }),
        );
      }

      it('should return only active clients when isActive=true', async () => {
        await createInactiveClient();

        const res = await request(app.getHttpServer())
          .get('/clients?isActive=true&limit=50')
          .set(authHeader(adminToken))
          .expect(200);

        const clients = res.body.data.data as { isActive: boolean }[];
        expect(clients.length).toBeGreaterThan(0);
        expect(clients.every((c) => c.isActive === true)).toBe(true);
      });

      it('should return only inactive clients when isActive=false', async () => {
        const res = await request(app.getHttpServer())
          .get('/clients?isActive=false&limit=50')
          .set(authHeader(adminToken))
          .expect(200);

        const clients = res.body.data.data as { isActive: boolean; name: string }[];
        expect(clients.length).toBeGreaterThan(0);
        expect(clients.every((c) => c.isActive === false)).toBe(true);
        expect(clients.some((c) => c.name === 'Inactive Filter Client')).toBe(
          true,
        );
      });
    });
  });

  describe('GET /clients/:id', () => {
    it('should get a client by id as admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/clients/${seed.client.id}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as {
        data: { id: string; name: string; email: string };
      };
      expect(body.data.id).toBe(seed.client.id);
      expect(body.data.name).toBe(seed.client.name);
      expect(body.data.email).toBe(seed.client.email);
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .get(`/clients/${fakeId}`)
        .set(authHeader(adminToken))
        .expect(404);

      expect((res.body as { message: string }).message).toContain('not found');
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/clients/not-a-uuid')
        .set(authHeader(adminToken))
        .expect(400);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .get(`/clients/${seed.client.id}`)
        .expect(401);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .get(`/clients/${seed.client.id}`)
        .set(authHeader(technicianToken))
        .expect(403);
    });
  });

  describe('PATCH /clients/:id', () => {
    it('should update a client as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/clients/${seed.client.id}`)
        .set(authHeader(adminToken))
        .send({ name: 'Updated Client' })
        .expect(200);

      const body = res.body as {
        data: { id: string; name: string };
      };
      expect(body.data.name).toBe('Updated Client');
      expect(body.data.id).toBe(seed.client.id);
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/clients/${fakeId}`)
        .set(authHeader(adminToken))
        .send({ name: 'Ghost' })
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/clients/${seed.client.id}`)
        .send({ name: 'No Auth' })
        .expect(401);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .patch(`/clients/${seed.client.id}`)
        .set(authHeader(technicianToken))
        .send({ name: 'Tech Update' })
        .expect(403);
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should soft delete a client as admin', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/clients')
        .set(authHeader(adminToken))
        .send({
          name: 'To Delete',
          email: 'todelete@test.com',
          phone: '+54 11 7777-7777',
          address: 'Delete Address',
        })
        .expect(201);

      const clientId = (createRes.body as { data: { id: string } }).data.id;

      await request(app.getHttpServer())
        .delete(`/clients/${clientId}`)
        .set(authHeader(adminToken))
        .expect(200);
    });

    it('should return 404 for non-existent client', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/clients/${fakeId}`)
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${seed.client.id}`)
        .expect(401);
    });

    it('should return 403 with technician role', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${seed.client.id}`)
        .set(authHeader(technicianToken))
        .expect(403);
    });
  });
});
