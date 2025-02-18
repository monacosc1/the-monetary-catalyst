import { createCheckoutSession } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'test_session_id',
          url: 'https://checkout.stripe.com/test'
        })
      }
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'test_customer_id',
        email: 'test@example.com'
      })
    }
  }));
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('Payment Controller - Create Checkout', () => {
  beforeEach(async () => {
    await databaseHelper.cleanTables();
    resetMocks();
  });

  it('should create checkout session for new customer', async () => {
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    };

    // Mock that user has no Stripe customer ID
    mockSupabase.from('test_user_profiles')
      .mockSuccess({
        id: 'test-profile-id',
        user_id: testUser.id,
        email: testUser.email,
        stripe_customer_id: null
      });

    // Mock successful customer ID update
    mockSupabase.from('test_user_profiles')
      .mockSuccess({
        id: 'test-profile-id',
        user_id: testUser.id,
        stripe_customer_id: 'test_customer_id'
      });

    const mockReq = mockHelper.createMockRequest({
      user: testUser,
      body: {
        priceId: 'test_price_id'
      }
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('checkout.stripe.com')
      })
    );
  });

  it('should create checkout session for existing customer', async () => {
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    };

    // Mock user with existing Stripe customer ID
    mockSupabase.from('test_user_profiles')
      .mockSuccess({
        id: 'test-profile-id',
        user_id: testUser.id,
        email: testUser.email,
        stripe_customer_id: 'existing_customer_id'
      });

    const mockReq = mockHelper.createMockRequest({
      user: testUser,
      body: {
        priceId: 'test_price_id'
      }
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining('checkout.stripe.com')
      })
    );
  });

  it('should handle unauthorized requests', async () => {
    const mockReq = mockHelper.createMockRequest({
      user: null,
      body: {
        priceId: 'test_price_id'
      }
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Unauthorized')
      })
    );
  });

  it('should handle missing price ID', async () => {
    const mockReq = mockHelper.createMockRequest({
      user: { id: 'test-user-id' },
      body: {}  // Missing priceId
    });
    const mockRes = mockHelper.createMockResponse();

    await createCheckoutSession(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('priceId')
      })
    );
  });
}); 