import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1/health (GET) reports app status', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data).toHaveProperty('database');
  });

  it('/api/v1/auth/login (POST) rejects invalid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-a-real-user@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('/api/v1/auth/refresh (POST) with no refresh cookie returns a clean 401, not a 500', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('unknown route returns 404', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/this-route-does-not-exist');
    expect(res.status).toBe(404);
  });

  afterEach(async () => {
    await app.close();
  });
});
