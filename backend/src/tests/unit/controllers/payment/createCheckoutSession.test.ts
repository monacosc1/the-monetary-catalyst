/// <reference types="jest" />

import { createCheckoutSession } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks, createMockQueryBuilder } from '../../../helpers/mocks';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { TABLES } from '../../../../config/tables';
import Stripe from 'stripe';

// Type stripe as a mocked Stripe instance with Jest mock functions
const stripe = jest.requireMock('stripe') as {
  checkout: {
    sessions: {
      create: jest.Mock<Promise<Stripe.Response<Stripe.Checkout.Session>>>;
      // Add other methods if needed
    };
  };
  customers: {
    create: jest.Mock<Promise<Stripe.Response<Stripe.Customer>>>;
    // Add other methods if needed
  };
  // Add other Stripe properties as needed
};

interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
}

describe('Payment Controller - createCheckoutSession', () => {
  beforeEach(async () => {
    if (!mockHelper.cleanTables) {
      mockHelper.cleanTables = jest.fn(() => Promise.resolve());
    }
    await mockHelper.cleanTables();
    resetMocks();
    jest.clearAllMocks();
    console.log('Pre-test Stripe mock state:', {
      stripeType: typeof stripe,
      hasCheckout: !!stripe.checkout,
      hasSessionsCreate: !!stripe.checkout?.sessions?.create,
      hasCustomersCreate: !!stripe.customers?.create
    });
  });

  it('creates a checkout session for an authenticated user with existing customer', async () => {
    const testUser = { id: 'user_123', email: 'test@example.com' };

    const qb = createMockQueryBuilder(TABLES.USER_PROFILES);
    qb.single.mockResolvedValue({
      data: { stripe_customer_id: 'cus_existing123' },
      error: null
    } as PostgrestSingleResponse<Subscription>);
    (mockSupabase.from as jest.Mock).mockReturnValue(qb);

    const mockReq = mockHelper.createMockRequest({
      user: testUser,
      body: { priceId: 'price_456' }
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    console.log('Post-call Stripe calls:', {
      sessionsCreateCalls: stripe.checkout.sessions.create.mock.calls,
      customersCreateCalls: stripe.customers.create.mock.calls
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      url: expect.stringContaining('checkout.stripe.com')
    });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: 'cus_existing123',
      line_items: [{ price: 'price_456', quantity: 1 }],
      success_url: expect.stringContaining('/success'),
      cancel_url: expect.stringContaining('/pricing'),
      client_reference_id: 'user_123',
      metadata: { userId: 'user_123', environment: 'test' }
    });
  });

  it('creates a checkout session for an authenticated user and new customer', async () => {
    const testUser = { id: 'user_123', email: 'test@example.com' };

    const qb = createMockQueryBuilder(TABLES.USER_PROFILES);
    qb.single.mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null
    } as PostgrestSingleResponse<Subscription>);
    (mockSupabase.from as jest.Mock).mockReturnValue(qb);

    const mockReq = mockHelper.createMockRequest({
      user: testUser,
      body: { priceId: 'price_456' }
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    console.log('Post-call Stripe calls:', {
      sessionsCreateCalls: stripe.checkout.sessions.create.mock.calls,
      customersCreateCalls: stripe.customers.create.mock.calls
    });

    expect(mockRes.json).toHaveBeenCalledWith({
      url: expect.stringContaining('checkout.stripe.com')
    });
    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { userId: 'user_123' }
    });
  });

  it('handles unauthorized users', async () => {
    const mockReq = mockHelper.createMockRequest({
      user: null,
      body: { priceId: 'price_456' }
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('handles missing price ID', async () => {
    const mockReq = mockHelper.createMockRequest({
      user: { id: 'user_123' },
      body: {}
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'priceId is required'
    });
  });
});