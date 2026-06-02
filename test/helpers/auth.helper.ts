import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: 'admin@test.local', password: 'test123' })
    .expect(201);

  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

export async function loginAsTechnician(
  app: INestApplication,
  email = 'tech@test.local',
  password = 'test123',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return (res.body as { data: { accessToken: string } }).data.accessToken;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
