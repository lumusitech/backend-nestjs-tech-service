import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import { authHeader, loginAsAdmin } from './helpers/auth.helper';

interface PortalResponse {
  data: {
    trackingCode: string;
    status: string;
    priority: string;
    location: string;
    diagnosis: string | null;
    scheduledDate: string | null;
    startedAt: string | null;
    completedAt: string | null;
    warrantyUntil: string | null;
    createdAt: string;
    serviceType: { name: string; description: string };
    clientName: string;
    tasks: {
      title: string;
      description: string;
      isCompleted: boolean;
      completedAt: string | null;
    }[];
    publicNotes: {
      type: string;
      content: string;
      createdAt: string;
    }[];
    paymentSummary: {
      totalApproved: number;
      paymentCount: number;
      hasPayments: boolean;
      isFullyPaid: boolean;
      installmentsPending: number;
      installmentsTotal: number;
    };
  };
}

describe('Portal (e2e)', () => {
  let app: INestApplication<App>;
  let seed: SeedData;
  let trackingCode: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    const adminToken = await loginAsAdmin(app);

    const woRes = await request(app.getHttpServer())
      .post('/work-orders')
      .set(authHeader(adminToken))
      .send({
        clientId: seed.client.id,
        serviceTypeId: seed.serviceType.id,
        diagnosis: 'Pantalla rota',
      })
      .expect(201);

    trackingCode = (woRes.body as { data: { trackingCode: string } }).data
      .trackingCode;
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('GET /portal/track/:trackingCode', () => {
    it('should track a work order by code', async () => {
      const res = await request(app.getHttpServer())
        .get(`/portal/track/${trackingCode}`)
        .expect(200);

      const body = res.body as PortalResponse;
      expect(body.data.trackingCode).toBe(trackingCode);
      expect(body.data.status).toBeDefined();
      expect(body.data.priority).toBeDefined();
      expect(body.data.location).toBeDefined();
      expect(body.data.serviceType).toBeDefined();
      expect(body.data.serviceType.name).toBe('Reparación de PC');
      expect(body.data.clientName).toBe('Test Client');
      expect(body.data.paymentSummary).toBeDefined();
      expect(body.data.paymentSummary.hasPayments).toBe(false);
    });

    it('should return public data without sensitive fields', async () => {
      const res = await request(app.getHttpServer())
        .get(`/portal/track/${trackingCode}`)
        .expect(200);

      const body = res.body as Record<string, unknown>;
      expect(body).not.toHaveProperty('cost');
      expect(body).not.toHaveProperty('costs');
      expect(body).not.toHaveProperty('supplier');
      expect(body).not.toHaveProperty('suppliers');
      expect(body).not.toHaveProperty('internalNotes');
      expect(body).not.toHaveProperty('notes');
      expect(body).not.toHaveProperty('technicians');
    });

    it('should return 404 for invalid tracking code', async () => {
      await request(app.getHttpServer())
        .get('/portal/track/INVALID-CODE')
        .expect(404);
    });

    it('should not require authentication', async () => {
      const res = await request(app.getHttpServer())
        .get(`/portal/track/${trackingCode}`)
        .expect(200);

      const body = res.body as PortalResponse;
      expect(body.data.trackingCode).toBe(trackingCode);
    });

    it('should return 404 for empty tracking code route', async () => {
      await request(app.getHttpServer()).get('/portal/track/').expect(404);
    });
  });
});
