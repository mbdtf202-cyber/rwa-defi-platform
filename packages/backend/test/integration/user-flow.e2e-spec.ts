import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Complete User Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let spvId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. User Registration and Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      
      userId = response.body.user.id;
      authToken = response.body.accessToken;
    });

    it('should login with credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      authToken = response.body.accessToken;
    });

    it('should get user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe('test@example.com');
    });
  });

  describe('2. KYC Verification', () => {
    it('should start KYC process', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/kyc/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: '1990-01-01',
          country: 'US',
        })
        .expect(201);

      expect(response.body).toHaveProperty('kycId');
      expect(response.body.status).toBe('PENDING');
    });

    it('should get KYC status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/kyc/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('3. SPV and Property Management', () => {
    it('should create an SPV', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/spvs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Property SPV',
          description: 'Test property for e2e testing',
          jurisdiction: 'Delaware',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      spvId = response.body.id;
    });

    it('should get SPV details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/spvs/${spvId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.name).toBe('Test Property SPV');
    });

    it('should add property to SPV', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/spvs/${spvId}/properties`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          propertyType: 'RESIDENTIAL',
          purchasePrice: 500000,
          area: 2000,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('4. Token Operations', () => {
    it('should mint tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tokens/mint')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          spvId: spvId,
          amount: '1000',
          recipient: '0x1234567890123456789012345678901234567890',
        })
        .expect(201);

      expect(response.body).toHaveProperty('transactionHash');
    });

    it('should get token balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tokens/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ spvId: spvId })
        .expect(200);

      expect(response.body).toHaveProperty('balance');
    });
  });

  describe('5. AI/ML Services', () => {
    it('should get property valuation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/avm/${spvId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('value');
      expect(response.body).toHaveProperty('confidence');
    });

    it('should get risk score', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/risk/score/${spvId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('riskLevel');
    });
  });

  describe('6. Document Management', () => {
    it('should upload document', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .field('entityType', 'SPV')
        .field('entityId', spvId)
        .field('documentType', 'DEED')
        .attach('file', Buffer.from('test file content'), 'test.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('ipfsHash');
    });

    it('should list documents', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ entityType: 'SPV', entityId: spvId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('7. Marketplace', () => {
    it('should create sell order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/marketplace/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          spvId: spvId,
          type: 'SELL',
          amount: '100',
          price: '1.5',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should get order book', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/marketplace/orderbook')
        .query({ spvId: spvId })
        .expect(200);

      expect(response.body).toHaveProperty('bids');
      expect(response.body).toHaveProperty('asks');
    });
  });

  describe('8. Accounting and Reports', () => {
    it('should get account statement', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/accounting/statement')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ spvId: spvId })
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
    });

    it('should generate tax report', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/accounting/tax-report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          year: 2025,
          userId: userId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('reportId');
    });
  });

  describe('9. Audit Logs', () => {
    it('should get audit logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('10. Monitoring', () => {
    it('should get system health', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should get metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/monitoring/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
    });
  });
});
