import request from 'supertest';
import { Application } from 'express';
import app from '../../../app';

describe('Payment Integration', () => {
  let testApp: Application;

  beforeAll(() => {
    testApp = app;
  });

  it('should create Stripe checkout session', async () => {
    const response = await request(testApp)
      .post('/api/create-checkout-session')
      .send({
        priceId: process.env.STRIPE_TEST_PRICE_ID,
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(response.body.url).toContain('checkout.stripe.com');
  });
}); 