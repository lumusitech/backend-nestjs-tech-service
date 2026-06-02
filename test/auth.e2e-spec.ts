import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { seedTestData } from './helpers/seed.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await seedTestData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return accessToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.local', password: 'test123' })
        .expect(201);

      expect(
        (res.body as { data: { accessToken: string } }).data.accessToken,
      ).toBeDefined();
      expect(
        typeof (res.body as { data: { accessToken: string } }).data.accessToken,
      ).toBe('string');
    });

    it('should return 401 with invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@test.local', password: 'wrongpassword' })
        .expect(401);

      expect((res.body as { message: string }).message).toBe(
        'Invalid credentials',
      );
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@test.local', password: 'test123' })
        .expect(401);

      expect((res.body as { message: string }).message).toBe(
        'Invalid credentials',
      );
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@test.local',
          password: 'newpass123',
        })
        .expect(201);

      const body = res.body as {
        data: { id: string; email: string; name: string; password?: string };
      };
      expect(body.data.id).toBeDefined();
      expect(body.data.email).toBe('newuser@test.local');
      expect(body.data.name).toBe('New User');
      expect(body.data.password).toBeUndefined();
    });

    it('should return 409 with duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'admin@test.local',
          password: 'test123',
        })
        .expect(409);

      expect((res.body as { message: string }).message).toBe(
        'Email already exists',
      );
    });
  });
});
