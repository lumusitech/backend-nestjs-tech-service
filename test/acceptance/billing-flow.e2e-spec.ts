import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from '../helpers/app.helper';
import {
  seedTestData,
  SeedData,
  cleanupDatabase,
} from '../helpers/seed.helper';
import { authHeader, loginAsAdmin } from '../helpers/auth.helper';

interface ApiResponse<T> {
  data: T;
}

interface ClientData {
  id: string;
  name: string;
  cuit: string;
  ivaCondition: string;
}

interface WorkOrderData {
  id: string;
  trackingCode: string;
}

interface PaymentData {
  id: string;
  amount: number;
  status: string;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  clientName: string;
  clientCuit: string | null;
  clientIvaCondition: string | null;
  subtotal: number;
  total: number;
  workOrderId: string;
  cae: string | null;
  caeExpiry: string | null;
  issuedAt: string | null;
  cancelledAt: string | null;
}

describe('Billing Full Lifecycle (acceptance)', () => {
  let app: INestApplication<App>;
  let seed: SeedData;
  let adminToken: string;
  let clientId: string;
  let workOrderId: string;
  let paymentId: string;
  let invoiceId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  it('1. should login as admin', () => {
    expect(adminToken).toBeDefined();
    expect(adminToken.length).toBeGreaterThan(0);
  });

  it('2. should create a client with cuit and ivaCondition', async () => {
    const res = await request(app.getHttpServer())
      .post('/clients')
      .set(authHeader(adminToken))
      .send({
        name: 'Billing Test Client',
        email: 'billing@test.com',
        phone: '+54 11 8888-0000',
        address: 'Billing Avenue 789',
        cuit: '30-71234567-1',
        ivaCondition: 'responsable_inscripto',
      })
      .expect(201);

    const body = res.body as ApiResponse<ClientData>;
    clientId = body.data.id;
    expect(body.data.cuit).toBe('30-71234567-1');
    expect(body.data.ivaCondition).toBe('responsable_inscripto');
  });

  it('3. should create a work order', async () => {
    const res = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(adminToken))
      .send({
        clientId,
        serviceTypeId: seed.serviceType.id,
        priority: 'medium',
      })
      .expect(201);

    const body = res.body as ApiResponse<WorkOrderData>;
    workOrderId = body.data.id;
    expect(body.data.trackingCode).toMatch(/^TS-/);
  });

  it('4. should create a payment for the work order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/work-orders/${workOrderId}/payments`)
      .set(authHeader(adminToken))
      .send({
        amount: 15000,
        method: 'transfer',
        provider: 'transfer',
        description: 'Pago parcial facturación',
      })
      .expect(201);

    const body = res.body as ApiResponse<PaymentData>;
    paymentId = body.data.id;
    expect(body.data.amount).toBe(15000);
    expect(body.data.status).toBe('pending');
  });

  it('5. should create a draft invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/billing/invoices')
      .set(authHeader(adminToken))
      .send({
        workOrderId,
        invoiceType: 'A',
        pointOfSale: 1,
        clientName: 'Billing Test Client',
        clientCuit: '30-71234567-1',
        clientAddress: 'Billing Avenue 789',
        clientIvaCondition: 'responsable_inscripto',
        subtotal: 15000,
        ivaAmount: 3150,
        total: 18150,
        paymentId,
      })
      .expect(201);

    const body = res.body as ApiResponse<InvoiceData>;
    invoiceId = body.data.id;
    expect(body.data.invoiceNumber).toBeDefined();
    expect(body.data.invoiceType).toBe('A');
    expect(body.data.clientName).toBe('Billing Test Client');
    expect(body.data.clientCuit).toBe('30-71234567-1');
    expect(body.data.subtotal).toBe(15000);
    expect(body.data.total).toBe(18150);
    expect(body.data.workOrderId).toBe(workOrderId);
  });

  it('6. should verify invoice is in DRAFT status', async () => {
    const res = await request(app.getHttpServer())
      .get(`/billing/invoices/${invoiceId}`)
      .set(authHeader(adminToken))
      .expect(200);

    const body = res.body as ApiResponse<InvoiceData>;
    expect(body.data.status).toBe('draft');
    expect(body.data.cae).toBeNull();
    expect(body.data.issuedAt).toBeNull();
  });

  it('7. should issue the invoice', async () => {
    const res = await request(app.getHttpServer())
      .post(`/billing/invoices/${invoiceId}/issue`)
      .set(authHeader(adminToken))
      .expect(200);

    const body = res.body as ApiResponse<InvoiceData>;
    expect(body.data.status).toBe('issued');
    expect(body.data.cae).toBeDefined();
    expect(body.data.caeExpiry).toBeDefined();
    expect(body.data.issuedAt).toBeDefined();
  });

  it('8. should verify invoice has CAE and status ISSUED', async () => {
    const res = await request(app.getHttpServer())
      .get(`/billing/invoices/${invoiceId}`)
      .set(authHeader(adminToken))
      .expect(200);

    const body = res.body as ApiResponse<InvoiceData>;
    expect(body.data.status).toBe('issued');
    expect(body.data.cae).toBeTruthy();
    expect(body.data.caeExpiry).toBeTruthy();
    expect(body.data.issuedAt).toBeTruthy();
  });

  it('9. should download invoice PDF', async () => {
    const res = await request(app.getHttpServer())
      .get(`/billing/invoices/${invoiceId}/pdf`)
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('factura-');
    expect((res.body as Buffer).length).toBeGreaterThan(0);
  });

  it('10. should verify PDF content-type is application/pdf', async () => {
    const res = await request(app.getHttpServer())
      .get(`/billing/invoices/${invoiceId}/pdf`)
      .set(authHeader(adminToken))
      .expect(200);

    expect(res.headers['content-type']).toBe('application/pdf');
  });

  it('11. should cancel the invoice', async () => {
    const res = await request(app.getHttpServer())
      .post(`/billing/invoices/${invoiceId}/cancel`)
      .set(authHeader(adminToken))
      .expect(200);

    const body = res.body as ApiResponse<InvoiceData>;
    expect(body.data.status).toBe('cancelled');
    expect(body.data.cancelledAt).toBeDefined();
  });

  it('12. should verify invoice status is CANCELLED', async () => {
    const res = await request(app.getHttpServer())
      .get(`/billing/invoices/${invoiceId}`)
      .set(authHeader(adminToken))
      .expect(200);

    const body = res.body as ApiResponse<InvoiceData>;
    expect(body.data.status).toBe('cancelled');
    expect(body.data.cancelledAt).toBeTruthy();
  });

  it('13. should not be able to issue a cancelled invoice', async () => {
    await request(app.getHttpServer())
      .post(`/billing/invoices/${invoiceId}/issue`)
      .set(authHeader(adminToken))
      .expect(400);
  });
});
