import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, SeedData, cleanupDatabase } from './helpers/seed.helper';
import {
  authHeader,
  loginAsAdmin,
  loginAsTechnician,
} from './helpers/auth.helper';

interface InquiryData {
  id: string;
  clientName: string;
  description: string;
  source: string;
  status: string;
  priority: string | null;
  assignedToId: string | null;
  createdById: string;
  technicianNotes: string | null;
  estimatedCost: number | null;
  estimatedDuration: number | null;
  materialsNeeded: string | null;
  recommendation: string | null;
  adminDecision: string;
  adminNotes: string | null;
  workOrderId: string | null;
  contactedAt: string | null;
  reviewedAt: string | null;
}

interface InquiryListResponse {
  data: {
    data: InquiryData[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

describe('Inquiries (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let technicianToken: string;
  let seed: SeedData;
  let inquiryId: string;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    seed = await seedTestData(app);
    adminToken = await loginAsAdmin(app);
    technicianToken = await loginAsTechnician(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('POST /inquiries', () => {
    it('should create an inquiry as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/inquiries')
        .set(authHeader(adminToken))
        .send({
          clientName: 'Juan Pérez',
          clientPhone: '+54 11 1234-5678',
          clientEmail: 'juan@test.com',
          clientAddress: 'Av. Corrientes 1234',
          description: 'La notebook no prende, hace ruido raro el ventilador',
          source: 'phone',
          priority: 'high',
        })
        .expect(201);

      const body = res.body as { data: InquiryData };
      expect(body.data.id).toBeDefined();
      expect(body.data.clientName).toBe('Juan Pérez');
      expect(body.data.description).toBe(
        'La notebook no prende, hace ruido raro el ventilador',
      );
      expect(body.data.source).toBe('phone');
      expect(body.data.status).toBe('new');
      expect(body.data.priority).toBe('high');
      expect(body.data.createdById).toBeDefined();
      inquiryId = body.data.id;
    });

    it('should create an inquiry with assigned technician', async () => {
      const res = await request(app.getHttpServer())
        .post('/inquiries')
        .set(authHeader(adminToken))
        .send({
          clientName: 'María García',
          description: 'Instalación de cámaras de seguridad',
          source: 'whatsapp',
          assignedToId: seed.technician.id,
        })
        .expect(201);

      const body = res.body as { data: InquiryData };
      expect(body.data.assignedToId).toBe(seed.technician.id);
    });

    it('should fail without required fields', async () => {
      await request(app.getHttpServer())
        .post('/inquiries')
        .set(authHeader(adminToken))
        .send({
          clientName: 'Incomplete',
        })
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/inquiries')
        .send({
          clientName: 'No Auth',
          description: 'Test',
          source: 'phone',
        })
        .expect(401);
    });

    it('should fail with technician role (admin only)', async () => {
      await request(app.getHttpServer())
        .post('/inquiries')
        .set(authHeader(technicianToken))
        .send({
          clientName: 'Tech User',
          description: 'Test',
          source: 'phone',
        })
        .expect(403);
    });
  });

  describe('GET /inquiries', () => {
    it('should list inquiries as admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/inquiries')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InquiryListResponse;
      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data.total).toBeDefined();
      expect(body.data.page).toBeDefined();
      expect(body.data.limit).toBeDefined();
      expect(body.data.totalPages).toBeDefined();
    });

    it('should list inquiries as technician', async () => {
      const res = await request(app.getHttpServer())
        .get('/inquiries')
        .set(authHeader(technicianToken))
        .expect(200);

      const body = res.body as InquiryListResponse;
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/inquiries?status=new')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InquiryListResponse;
      body.data.data.forEach((inquiry) => {
        expect(inquiry.status).toBe('new');
      });
    });

    it('should filter by source', async () => {
      const res = await request(app.getHttpServer())
        .get('/inquiries?source=phone')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InquiryListResponse;
      body.data.data.forEach((inquiry) => {
        expect(inquiry.source).toBe('phone');
      });
    });

    it('should support pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/inquiries?page=1&limit=1')
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as InquiryListResponse;
      expect(body.data.data.length).toBeLessThanOrEqual(1);
      expect(body.data.limit).toBe(1);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer()).get('/inquiries').expect(401);
    });
  });

  describe('GET /inquiries/:id', () => {
    it('should return a single inquiry', async () => {
      const res = await request(app.getHttpServer())
        .get(`/inquiries/${inquiryId}`)
        .set(authHeader(adminToken))
        .expect(200);

      const body = res.body as { data: InquiryData };
      expect(body.data.id).toBe(inquiryId);
      expect(body.data.clientName).toBe('Juan Pérez');
    });

    it('should return 404 for non-existent inquiry', async () => {
      await request(app.getHttpServer())
        .get('/inquiries/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 400 for invalid uuid', async () => {
      await request(app.getHttpServer())
        .get('/inquiries/not-a-uuid')
        .set(authHeader(adminToken))
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .get(`/inquiries/${inquiryId}`)
        .expect(401);
    });
  });

  describe('PATCH /inquiries/:id', () => {
    it('should update an inquiry', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}`)
        .set(authHeader(adminToken))
        .send({ priority: 'urgent', clientPhone: '+54 11 9999-0000' })
        .expect(200);

      const body = res.body as { data: InquiryData };
      expect(body.data.priority).toBe('urgent');
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}`)
        .send({ priority: 'low' })
        .expect(401);
    });

    it('should fail with technician role (admin only)', async () => {
      await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}`)
        .set(authHeader(technicianToken))
        .send({ priority: 'low' })
        .expect(403);
    });
  });

  describe('PATCH /inquiries/:id/contact', () => {
    it('should contact an inquiry (new → contacted)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}/contact`)
        .set(authHeader(adminToken))
        .send({
          technicianNotes: 'El ventilador está sucio, necesita limpieza',
          estimatedCost: 15000,
          estimatedDuration: 2,
          materialsNeeded: 'Pasta térmica Arctic MX-4',
          recommendation: 'repair',
        })
        .expect(200);

      const body = res.body as { data: InquiryData };
      expect(body.data.status).toBe('contacted');
      expect(body.data.technicianNotes).toBe(
        'El ventilador está sucio, necesita limpieza',
      );
      expect(body.data.estimatedCost).toBe(15000);
      expect(body.data.contactedAt).toBeDefined();
    });

    it('should fail to contact an already contacted inquiry', async () => {
      await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}/contact`)
        .set(authHeader(adminToken))
        .send({
          technicianNotes: 'Second contact attempt',
        })
        .expect(400);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}/contact`)
        .send({ technicianNotes: 'Test' })
        .expect(401);
    });
  });

  describe('PATCH /inquiries/:id/review', () => {
    it('should review an inquiry (contacted → reviewed, approve)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}/review`)
        .set(authHeader(adminToken))
        .send({
          adminDecision: 'approved',
          adminNotes: 'Aprobado para reparación',
        })
        .expect(200);

      const body = res.body as { data: InquiryData };
      expect(body.data.status).toBe('reviewed');
      expect(body.data.adminDecision).toBe('approved');
      expect(body.data.adminNotes).toBe('Aprobado para reparación');
      expect(body.data.reviewedAt).toBeDefined();
    });

    it('should fail to review an already reviewed inquiry', async () => {
      await request(app.getHttpServer())
        .patch(`/inquiries/${inquiryId}/review`)
        .set(authHeader(adminToken))
        .send({
          adminDecision: 'rejected',
        })
        .expect(400);
    });
  });

  describe('POST /inquiries/:id/convert', () => {
    it('should convert an approved inquiry to a work order', async () => {
      const res = await request(app.getHttpServer())
        .post(`/inquiries/${inquiryId}/convert`)
        .set(authHeader(adminToken))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(201);

      const body = res.body as { data: InquiryData };
      expect(body.data.status).toBe('converted');
    });

    it('should fail to convert an already converted inquiry', async () => {
      await request(app.getHttpServer())
        .post(`/inquiries/${inquiryId}/convert`)
        .set(authHeader(adminToken))
        .send({
          clientId: seed.client.id,
          serviceTypeId: seed.serviceType.id,
        })
        .expect(400);
    });
  });

  describe('DELETE /inquiries/:id', () => {
    it('should soft delete an inquiry', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/inquiries')
        .set(authHeader(adminToken))
        .send({
          clientName: 'To Delete',
          description: 'Will be deleted',
          source: 'email',
        })
        .expect(201);

      const deleteId = (createRes.body as { data: InquiryData }).data.id;

      await request(app.getHttpServer())
        .delete(`/inquiries/${deleteId}`)
        .set(authHeader(adminToken))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/inquiries/${deleteId}`)
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 404 for non-existent inquiry', async () => {
      await request(app.getHttpServer())
        .delete('/inquiries/00000000-0000-0000-0000-000000000000')
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .delete(`/inquiries/${inquiryId}`)
        .expect(401);
    });

    it('should fail with technician role (admin only)', async () => {
      await request(app.getHttpServer())
        .delete(`/inquiries/${inquiryId}`)
        .set(authHeader(technicianToken))
        .expect(403);
    });
  });
});
