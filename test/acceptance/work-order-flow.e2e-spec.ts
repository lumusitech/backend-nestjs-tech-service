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

interface WorkOrderData {
  id: string;
  trackingCode: string;
  status: string;
  clientId: string;
  serviceTypeId: string;
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  cuit: string | null;
  ivaCondition: string | null;
}

interface ServiceTypeData {
  id: string;
  name: string;
}

interface TaskData {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
}

interface MaterialData {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
}

interface PaymentData {
  id: string;
  amount: number;
  method: string;
  status: string;
}

interface PortalData {
  trackingCode: string;
  status: string;
  clientName: string;
  serviceType: { name: string };
  tasks: { title: string; isCompleted: boolean }[];
  paymentSummary: { hasPayments: boolean; totalApproved: number };
}

interface ReportsSummaryData {
  kpis: Record<string, unknown>;
  workOrdersByStatus: unknown[];
  topServices: unknown[];
  paymentMethodDistribution: unknown[];
}

describe('Work Order Full Lifecycle (acceptance)', () => {
  let app: INestApplication<App>;
  let seed: SeedData;
  let adminToken: string;
  let clientId: string;
  let serviceTypeId: string;
  let workOrderId: string;
  let trackingCode: string;
  let taskId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  it('1. should login as admin and get token', () => {
    expect(adminToken).toBeDefined();
    expect(adminToken.length).toBeGreaterThan(0);
  });

  it('2. should create a client', async () => {
    const res = await request(app.getHttpServer())
      .post('/clients')
      .set(authHeader(adminToken))
      .send({
        name: 'Acceptance Client',
        email: 'acceptance@test.com',
        phone: '+54 11 9999-0000',
        address: 'Acceptance Street 456',
        cuit: '20-30405060-7',
        ivaCondition: 'responsable_inscripto',
      })
      .expect(201);

    const body = res.body as ApiResponse<ClientData>;
    clientId = body.data.id;
    expect(body.data.name).toBe('Acceptance Client');
    expect(body.data.email).toBe('acceptance@test.com');
    expect(body.data.cuit).toBe('20-30405060-7');
    expect(body.data.ivaCondition).toBe('responsable_inscripto');
  });

  it('3. should create a service type', async () => {
    const res = await request(app.getHttpServer())
      .post('/service-types')
      .set(authHeader(adminToken))
      .send({
        name: 'Instalación de cámaras',
        description: 'Instalación y configuración de cámaras de seguridad',
        estimatedDuration: 180,
      })
      .expect(201);

    const body = res.body as ApiResponse<ServiceTypeData>;
    serviceTypeId = body.data.id;
    expect(body.data.name).toBe('Instalación de cámaras');
  });

  it('4. should create a work order for the client', async () => {
    const res = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(adminToken))
      .send({
        clientId,
        serviceTypeId,
        priority: 'high',
        location: 'on_site',
        diagnosis: 'Instalación completa de 4 cámaras',
      })
      .expect(201);

    const body = res.body as ApiResponse<WorkOrderData>;
    workOrderId = body.data.id;
    trackingCode = body.data.trackingCode;
    expect(body.data.status).toBe('pending');
    expect(body.data.clientId).toBe(clientId);
    expect(body.data.serviceTypeId).toBe(serviceTypeId);
    expect(trackingCode).toMatch(/^TS-/);
  });

  it('5. should assign a technician to the work order', async () => {
    const res = await request(app.getHttpServer())
      .put(`/work-orders/${workOrderId}/technicians`)
      .set(authHeader(adminToken))
      .send({ technicianIds: [seed.technician.id] })
      .expect(200);

    const body = res.body as ApiResponse<WorkOrderData>;
    expect(body.data).toBeDefined();
  });

  it('6. should add tasks to the work order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/work-orders/${workOrderId}/tasks`)
      .set(authHeader(adminToken))
      .send({
        title: 'Cableado de cámaras',
        description: 'Tirar cables y conectar las 4 cámaras',
        assignedToId: seed.technician.id,
      })
      .expect(201);

    const body = res.body as ApiResponse<TaskData>;
    taskId = body.data.id;
    expect(body.data.title).toBe('Cableado de cámaras');
    expect(body.data.isCompleted).toBe(false);
  });

  it('7. should add materials to the work order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/work-orders/${workOrderId}/materials`)
      .set(authHeader(adminToken))
      .send({
        description: 'Cable UTP Cat5e (100m)',
        quantity: 2,
        unitCost: 5000,
        supplierId: seed.supplier.id,
      })
      .expect(201);

    const body = res.body as ApiResponse<MaterialData>;
    expect(body.data.id).toBeDefined();
    expect(body.data.description).toBe('Cable UTP Cat5e (100m)');
    expect(body.data.quantity).toBe(2);
    expect(body.data.unitCost).toBe(5000);
  });

  it('8. should complete the task', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}/tasks/${taskId}`)
      .set(authHeader(adminToken))
      .send({
        isCompleted: true,
        completedAt: new Date().toISOString(),
      })
      .expect(200);

    const body = res.body as ApiResponse<TaskData>;
    expect(body.data.isCompleted).toBe(true);
    expect(body.data.completedAt).toBeDefined();
  });

  it('9. should create a payment for the work order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/work-orders/${workOrderId}/payments`)
      .set(authHeader(adminToken))
      .send({
        amount: 25000,
        method: 'transfer',
        provider: 'transfer',
        description: 'Pago por instalación de cámaras',
      })
      .expect(201);

    const body = res.body as ApiResponse<PaymentData>;
    expect(body.data.id).toBeDefined();
    expect(body.data.amount).toBe(25000);
    expect(body.data.method).toBe('transfer');
    expect(body.data.status).toBe('approved');
  });

  it('10. should update work order status to completed', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/work-orders/${workOrderId}`)
      .set(authHeader(adminToken))
      .send({ status: 'completed', completedAt: new Date().toISOString() })
      .expect(200);

    const body = res.body as ApiResponse<WorkOrderData>;
    expect(body.data.status).toBe('completed');
  });

  it('11. should track the work order via portal without auth', async () => {
    const res = await request(app.getHttpServer())
      .get(`/portal/track/${trackingCode}`)
      .expect(200);

    const body = res.body as ApiResponse<PortalData>;
    expect(body.data.trackingCode).toBe(trackingCode);
    expect(body.data.status).toBe('completed');
    expect(body.data.clientName).toBe('Acceptance Client');
    expect(body.data.serviceType.name).toBe('Instalación de cámaras');
  });

  it('12. should verify portal response has correct task and payment data', async () => {
    const res = await request(app.getHttpServer())
      .get(`/portal/track/${trackingCode}`)
      .expect(200);

    const body = res.body as ApiResponse<PortalData>;
    expect(body.data.tasks.length).toBeGreaterThanOrEqual(1);
    expect(body.data.tasks[0].title).toBe('Cableado de cámaras');
    expect(body.data.tasks[0].isCompleted).toBe(true);
    expect(body.data.paymentSummary.hasPayments).toBe(true);
    expect(body.data.paymentSummary.totalApproved).toBe(25000);
  });

  it('13. should check reports summary reflects the new data', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/summary')
      .set(authHeader(adminToken))
      .expect(200);

    const body = res.body as ApiResponse<ReportsSummaryData>;
    expect(body.data.kpis).toBeDefined();
    expect(Array.isArray(body.data.workOrdersByStatus)).toBe(true);
    expect(Array.isArray(body.data.topServices)).toBe(true);
    expect(Array.isArray(body.data.paymentMethodDistribution)).toBe(true);

    const completedStatus = (
      body.data.workOrdersByStatus as { status: string; count: number }[]
    ).find((s) => s.status === 'completed');
    expect(completedStatus).toBeDefined();
    expect(completedStatus!.count).toBeGreaterThanOrEqual(1);
  });
});
