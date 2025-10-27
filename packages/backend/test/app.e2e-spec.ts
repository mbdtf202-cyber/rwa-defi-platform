import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('RWA DeFi Platform E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          authToken = res.body.accessToken;
          userId = res.body.user.id;
        });
    });

    it('should login with credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          authToken = res.body.accessToken;
        });
    });

    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('User Management', () => {
    it('should get user profile', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
        });
    });

    it('should update user profile', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
        });
    });
  });

  describe('KYC Flow', () => {
    it('should initiate KYC verification', () => {
      return request(app.getHttpServer())
        .post('/api/v1/kyc/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'ONFIDO',
          userData: {
            firstName: 'Test',
            lastName: 'User',
            dateOfBirth: '1990-01-01',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('verificationId');
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should get KYC status', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/kyc/status/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('SPV Management', () => {
    let spvId: string;

    it('should create a new SPV', () => {
      return request(app.getHttpServer())
        .post('/api/v1/spvs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyName: 'Test SPV LLC',
          jurisdiction: 'Delaware',
          legalRepresentative: 'John Doe',
          registrationNumber: 'REG123456',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          spvId = res.body.id;
        });
    });

    it('should get all SPVs', () => {
      return request(app.getHttpServer())
        .get('/api/v1/spvs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should add property to SPV', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/spvs/${spvId}/properties`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: '123 Main St, New York, NY',
          type: 'COMMERCIAL',
          area: 5000,
          purchasePrice: 5000000,
          monthlyRent: 50000,
        })
        .expect(201);
    });
  });

  describe('Health Checks', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });
  });
});
