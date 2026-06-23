import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

describe('SortBy Whitelist (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    await seedTestData(app);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  it('should accept valid sortBy for clients', async () => {
    const res = await request(app.getHttpServer())
      .get('/clients?sortBy=name&order=ASC')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('should ignore invalid sortBy and use default for clients', async () => {
    const res = await request(app.getHttpServer())
      .get('/clients?sortBy=DROP%20TABLE&order=ASC')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('should accept valid sortBy for work-orders', async () => {
    const res = await request(app.getHttpServer())
      .get('/work-orders?sortBy=status&order=DESC')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('should ignore invalid sortBy for work-orders', async () => {
    const res = await request(app.getHttpServer())
      .get('/work-orders?sortBy=invalid_column&order=DESC')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('should accept valid sortBy for billing', async () => {
    const res = await request(app.getHttpServer())
      .get('/billing/invoices?sortBy=invoiceNumber&order=ASC')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });

  it('should accept valid sortBy for pending-items', async () => {
    const res = await request(app.getHttpServer())
      .get('/pending-items?sortBy=dueDate&order=ASC')
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.body.data).toBeDefined();
  });
});
