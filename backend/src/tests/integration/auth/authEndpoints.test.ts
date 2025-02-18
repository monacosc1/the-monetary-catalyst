import request from 'supertest';
import { Express, Application } from 'express';
import app from '../../../app';
import { databaseHelper } from '../../helpers/database';

describe('Auth Endpoints (Integration)', () => {
  let testApp: Application;

  beforeAll(async () => {
    testApp = app;
    await databaseHelper.cleanTables();
  });

  beforeEach(async () => {
    await databaseHelper.cleanTables();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(testApp)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          first_name: 'Test',
          last_name: 'User',
          termsAccepted: true
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const response = await request(testApp)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });
  });
}); 