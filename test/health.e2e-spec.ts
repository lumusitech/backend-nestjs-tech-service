import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/app.helper';
import { seedTestData, cleanupDatabase } from './helpers/seed.helper';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = (await createTestApp()) as INestApplication<App>;
    await seedTestData(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 when database is healthy', async () => {
      const res = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const body = res.body as {
        data: { status: string; details: { database: { status: string } } };
      };
      expect(body.data.status).toBe('ok');
      expect(body.data.details).toBeDefined();
      expect(body.data.details.database).toBeDefined();
      expect(body.data.details.database.status).toBe('up');
    });

    it('should be accessible without auth (public)', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
    });
  });
});
