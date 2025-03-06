/// <reference types="jest" />

import { cancelSubscription } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { TABLES } from '../../../../config/tables';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import Stripe from 'stripe';

// Define a minimal mocked Stripe instance type
interface MockedStripeInstance {
  subscriptions: {
    list: jest.Mock<Promise<Stripe.ApiList<Stripe.Subscription>>>;
    update: jest.Mock<Promise<Stripe.Response<Stripe.Subscription>>>;
    [key: string]: any;
  };
  [key: string]: any;
}

// Mock Stripe globally for this test file
jest.mock('stripe', () => {
  console.log('Test file: Initializing custom Stripe mock');
  const stripeInstance: MockedStripeInstance = {
    subscriptions: {
      list: jest.fn(),
      update: jest.fn()
    }
  };
  const StripeMock = jest.fn((key: string, options: any) => {
    console.log('Test file: Stripe constructor called', { key, apiVersion: options?.apiVersion });
    return stripeInstance;
  });
  return StripeMock;
});

// Use the mocked Stripe instance
const stripe = jest.requireMock('stripe') as jest.MockedFunction<(key: string, options: any) => MockedStripeInstance>;
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY || 'test_key', { apiVersion: '2024-09-30.acacia' });

// Debug global mock availability
console.log('Test file: Global Stripe mock loaded:', {
  hasConstructor: !!stripe,
  hasSubscriptions: !!stripeInstance.subscriptions,
  hasSubscriptionsList: !!stripeInstance.subscriptions?.list,
  hasSubscriptionsUpdate: !!stripeInstance.subscriptions?.update,
  stripeInstanceKeys: Object.keys(stripeInstance)
});

describe('Payment Controller - cancelSubscription', () => {
  beforeEach(async () => {
    if (!mockHelper.cleanTables) {
      mockHelper.cleanTables = jest.fn(() => Promise.resolve());
    }
    await mockHelper.cleanTables();
    resetMocks();
    jest.clearAllMocks();
    console.log('BeforeEach: After clearing mocks', {
      hasSubscriptionsList: !!stripeInstance.subscriptions.list,
      hasSubscriptionsUpdate: !!stripeInstance.subscriptions.update,
      listMockCalls: stripeInstance.subscriptions.list.mock.calls.length,
      updateMockCalls: stripeInstance.subscriptions.update.mock.calls.length,
      listMockImpl: !!stripeInstance.subscriptions.list.getMockImplementation(),
      updateMockImpl: !!stripeInstance.subscriptions.update.getMockImplementation()
    });
  });

  it('successfully cancels an active subscription', async () => {
    console.log('Test 1: Setting up mock for successful cancellation');
    stripeInstance.subscriptions.list.mockResolvedValue({
      object: 'list',
      data: [{
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active'
      }],
      has_more: false,
      url: '/v1/subscriptions'
    } as Stripe.ApiList<Stripe.Subscription>);
    stripeInstance.subscriptions.update.mockResolvedValue({
      id: 'sub_123',
      cancel_at_period_end: true
    } as Stripe.Response<Stripe.Subscription>);
    (mockSupabase.from as jest.Mock)
      .mockImplementationOnce((table: string) => {
        console.log(`Test 1: mockSupabase.from called with table: ${table} (user_profiles)`);
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_123' },
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          } as PostgrestSingleResponse<any>)
        };
      })
      .mockImplementationOnce((table: string) => {
        console.log(`Test 1: mockSupabase.from called with table: ${table} (subscriptions select)`);
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { stripe_subscription_id: 'sub_123' },
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          } as PostgrestSingleResponse<any>)
        };
      })
      .mockImplementationOnce((table: string) => {
        console.log(`Test 1: mockSupabase.from called with table: ${table} (subscriptions update)`);
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null })
        };
      });

    const req: Partial<Request> = {
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`Test 1: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 1: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 1: Calling cancelSubscription');
    await cancelSubscription(req as Request, res as Response);
    console.log('Test 1: cancelSubscription completed', {
      listCalls: stripeInstance.subscriptions.list.mock.calls,
      updateCalls: stripeInstance.subscriptions.update.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(stripeInstance.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_123',
      status: 'active',
      limit: 1
    });
    expect(stripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true
    });
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('handles unauthorized users', async () => {
    console.log('Test 2: Setting up unauthorized user test');
    const req: Partial<Request> = {
      user: undefined
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`Test 2: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 2: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 2: Calling cancelSubscription');
    await cancelSubscription(req as Request, res as Response);
    console.log('Test 2: cancelSubscription completed', {
      listCalls: stripeInstance.subscriptions.list.mock.calls,
      updateCalls: stripeInstance.subscriptions.update.mock.calls
    });

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(stripeInstance.subscriptions.list).not.toHaveBeenCalled();
    expect(stripeInstance.subscriptions.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('handles no customer profile', async () => {
    console.log('Test 3: Setting up no customer profile test');
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`Test 3: mockSupabase.from called with table: ${table}`);
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No profile found' },
          count: null,
          status: 404,
          statusText: 'Not Found'
        } as PostgrestSingleResponse<any>)
      };
    });

    const req: Partial<Request> = {
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`Test 3: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 3: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 3: Calling cancelSubscription');
    await cancelSubscription(req as Request, res as Response);
    console.log('Test 3: cancelSubscription completed', {
      listCalls: stripeInstance.subscriptions.list.mock.calls,
      updateCalls: stripeInstance.subscriptions.update.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.subscriptions.list).not.toHaveBeenCalled();
    expect(stripeInstance.subscriptions.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No customer profile found' });
  });

  it('handles no active subscription in Stripe', async () => {
    console.log('Test 4: Setting up no active subscription test');
    stripeInstance.subscriptions.list.mockResolvedValue({
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/subscriptions'
    } as Stripe.ApiList<Stripe.Subscription>);
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`Test 4: mockSupabase.from called with table: ${table}`);
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { stripe_customer_id: 'cus_123' },
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        } as PostgrestSingleResponse<any>)
      };
    });

    const req: Partial<Request> = {
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`Test 4: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 4: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 4: Calling cancelSubscription');
    await cancelSubscription(req as Request, res as Response);
    console.log('Test 4: cancelSubscription completed', {
      listCalls: stripeInstance.subscriptions.list.mock.calls,
      updateCalls: stripeInstance.subscriptions.update.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_123',
      status: 'active',
      limit: 1
    });
    expect(stripeInstance.subscriptions.update).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No active subscription found in Stripe' });
  });

  it('handles Supabase update failure', async () => {
    console.log('Test 5: Setting up Supabase update failure test');
    stripeInstance.subscriptions.list.mockResolvedValue({
      object: 'list',
      data: [{
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active'
      }],
      has_more: false,
      url: '/v1/subscriptions'
    } as Stripe.ApiList<Stripe.Subscription>);
    stripeInstance.subscriptions.update.mockResolvedValue({
      id: 'sub_123',
      cancel_at_period_end: true
    } as Stripe.Response<Stripe.Subscription>);
    (mockSupabase.from as jest.Mock)
      .mockImplementationOnce((table: string) => {
        console.log(`Test 5: mockSupabase.from called with table: ${table} (user_profiles)`);
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { stripe_customer_id: 'cus_123' },
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          } as PostgrestSingleResponse<any>)
        };
      })
      .mockImplementationOnce((table: string) => {
        console.log(`Test 5: mockSupabase.from called with table: ${table} (subscriptions select)`);
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { stripe_subscription_id: 'sub_123' },
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
          } as PostgrestSingleResponse<any>)
        };
      })
      .mockImplementationOnce((table: string) => {
        console.log(`Test 5: mockSupabase.from called with table: ${table} (subscriptions update)`);
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } })
        };
      });

    const req: Partial<Request> = {
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`Test 5: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 5: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 5: Calling cancelSubscription');
    await cancelSubscription(req as Request, res as Response);
    console.log('Test 5: cancelSubscription completed', {
      listCalls: stripeInstance.subscriptions.list.mock.calls,
      updateCalls: stripeInstance.subscriptions.update.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(stripeInstance.subscriptions.list).toHaveBeenCalledWith({
      customer: 'cus_123',
      status: 'active',
      limit: 1
    });
    expect(stripeInstance.subscriptions.update).toHaveBeenCalledWith('sub_123', {
      cancel_at_period_end: true
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update subscription status' });
  });
});