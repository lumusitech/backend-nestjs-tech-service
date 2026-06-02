import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

interface InvoiceResponse {
  data: {
    id: string;
    invoiceNumber: string;
    invoiceType: string;
    status: string;
    clientName: string;
    clientAddress: string;
    subtotal: number;
    total: number;
    workOrderId: string;
    cae?: string;
    caeExpiry?: string;
    issuedAt?: string;
    cancelledAt?: string;
  };
}

interface InvoiceListResponse {
  data: {
    data: InvoiceResponse['data'][];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

describe('Billing (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let seed: SeedData;
  let workOrderId: string;
  let invoiceId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);

    const woRes = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(adminToken))
      .send({
        clientId: seed.client.id,
        serviceTypeId: seed.serviceType.id,
      })
      .expect(201);

    workOrderId = (woRes.body as { data: { id: string } }).data.id;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /billing/invoices', () => {
    it('should create a draft invoice', async () => {
      const res = await request(app.getHttpServer())
        .post('/billing/invoices')
        .set(authHeader(adminToken))
        .send({
          workOrderId,
          invoiceType: 'B',
          clientName: 'Test Client',
          clientAddress: 'Client Address 123',
          subtotal: 10000,
          total: 12100,
        })
        .expect(201);

      const body = res.body as InvoiceResponse;
      expect(body.data.id).toBeDefined();
      expect(body.data.invoiceNumber).toBeDefined();
      expect(body.data.invoiceType).toBe('B');
      expect(body.data.status).toBe('draft');
      expect(body.data.clientName).toBe('Test Client');
      expect(body.data.clientAddress).toBe('Client Address 123');
      expect(body.data.subtotal).toBe(10000);
      expect(body.data.total).toBe(12100);
      expect(body.data.workOrderId).toBe(workOrderId);
      invoiceId = body.data.id;
    });

    it('should create invoice with optional fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/billing/invoices')
        .set(authHeader(adminToken))
        .send({
          workOrderId,
          invoiceType: 'A',
          pointOfSale: 2,
          clientName: 'Empresa SA',
          clientCuit: '30-12345678-9',
          clientAddress: 'Av. Corrientes 1234',
          clientIvaCondition: 'responsable_inscripto',
          subtotal: 50000,
          ivaAmount: 10500,
          total: 60500,
        })
        .expect(201);

      const body = res.body as InvoiceResponse;
      expect(body.data.invoiceType).toBe('A');
      expect(body.data.clientName).toBe('Empresa SA');
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/billing/invoices')
        .set(authHeader(adminToken))
        .send({
          workOrderId,
          invoiceType: 'B',
        })
        .expect(400);
    });

    it('should fail with invalid invoiceType', async () => {
      await request(app.getHttpServer())
        .post('/billing/invoices')
        .set(authHeader(adminToken))
        .send({
          workOrderId,
          invoiceType: 'X',
          clientName: 'Test',
          clientAddress: 'Addr',
          subtotal: 100,
          total: 100,
        })
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/billing/invoices')
        .send({
          workOrderId,
          invoiceType: 'B',
          clientName: 'Test',
          clientAddress: 'Addr',
          subtotal: 100,
          total: 100,
        })
        .expect(403);
    });
  });

  describe('GET /billing/invoices', () => {
    it('should list all invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/billing/invoices')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceListResponse;
      expect(body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data.total).toBeGreaterThanOrEqual(2);
      expect(body.data.page).toBe(1);
      expect(body.data.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/billing/invoices?status=draft')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceListResponse;
      body.data.data.forEach((inv) => {
        expect(inv.status).toBe('draft');
      });
    });

    it('should filter by invoiceType', async () => {
      const res = await request(app.getHttpServer())
        .get('/billing/invoices?invoiceType=B')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceListResponse;
      body.data.data.forEach((inv) => {
        expect(inv.invoiceType).toBe('B');
      });
    });

    it('should filter by clientName', async () => {
      const res = await request(app.getHttpServer())
        .get('/billing/invoices?clientName=Test')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceListResponse;
      expect(body.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/billing/invoices?page=1&limit=1')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceListResponse;
      expect(body.data.data.length).toBeLessThanOrEqual(1);
      expect(body.data.limit).toBe(1);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer()).get('/billing/invoices').expect(403);
    });
  });

  describe('GET /billing/invoices/:id', () => {
    it('should return a single invoice', async () => {
      const res = await request(app.getHttpServer())
        .get(`/billing/invoices/${invoiceId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceResponse;
      expect(body.data.id).toBe(invoiceId);
      expect(body.data.invoiceNumber).toBeDefined();
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .get('/billing/invoices/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/billing/invoices/invalid-uuid')
        .set(authHeader(adminToken))
        .expect(400);
    });
  });

  describe('POST /billing/invoices/:id/issue', () => {
    it('should issue a draft invoice', async () => {
      const res = await request(app.getHttpServer())
        .post(`/billing/invoices/${invoiceId}/issue`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceResponse;
      expect(body.data.status).toBe('issued');
      expect(body.data.cae).toBeDefined();
      expect(body.data.caeExpiry).toBeDefined();
      expect(body.data.issuedAt).toBeDefined();
    });

    it('should fail to issue an already issued invoice', async () => {
      await request(app.getHttpServer())
        .post(`/billing/invoices/${invoiceId}/issue`)
        .set(authHeader(adminToken))
        .expect(400);
    });
  });

  describe('POST /billing/invoices/:id/cancel', () => {
    it('should cancel an issued invoice', async () => {
      const res = await request(app.getHttpServer())
        .post(`/billing/invoices/${invoiceId}/cancel`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InvoiceResponse;
      expect(body.data.status).toBe('cancelled');
      expect(body.data.cancelledAt).toBeDefined();
    });

    it('should fail to cancel an already cancelled invoice', async () => {
      await request(app.getHttpServer())
        .post(`/billing/invoices/${invoiceId}/cancel`)
        .set(authHeader(adminToken))
        .expect(400);
    });

    it('should fail to cancel a draft invoice', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/billing/invoices')
        .set(authHeader(adminToken))
        .send({
          workOrderId,
          invoiceType: 'C',
          clientName: 'Draft Client',
          clientAddress: 'Draft Addr',
          subtotal: 500,
          total: 500,
        })
        .expect(201);

      const draftId = (createRes.body as InvoiceResponse).data.id;

      await request(app.getHttpServer())
        .post(`/billing/invoices/${draftId}/cancel`)
        .set(authHeader(adminToken))
        .expect(400);
    });
  });

  describe('GET /billing/invoices/:id/pdf', () => {
    it('should download invoice PDF', async () => {
      const res = await request(app.getHttpServer())
        .get(`/billing/invoices/${invoiceId}/pdf`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('factura-');
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent invoice', async () => {
      await request(app.getHttpServer())
        .get('/billing/invoices/00000000-0000-0000-0000-000000000000/pdf')
        .set(authHeader(adminToken))
        .expect(404);
    });
  });
});
