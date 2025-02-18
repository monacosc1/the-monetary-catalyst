import request from 'supertest';
import { Application } from 'express';
import app from '../../../app';
import Stripe from 'stripe';

describe('Stripe Webhooks', () => {
  let testApp: Application;

  beforeAll(() => {
    testApp = app;
  });

  it('should handle successful payment webhook', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_123'
        }
      }
    };

    const response = await request(testApp)
      .post('/api/webhook/stripe')
      .send(mockEvent)
      .set('stripe-signature', 'test_signature');

    expect(response.status).toBe(200);
  });
}); 