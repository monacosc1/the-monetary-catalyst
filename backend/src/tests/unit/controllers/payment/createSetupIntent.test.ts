/// <reference types="jest" />

import { createSetupIntent } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { TABLES } from '../../../../config/tables';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import Stripe from 'stripe';

// Define a minimal mocked Stripe instance type
interface MockedStripeInstance {
  setupIntents: {
    create: jest.Mock<Promise<Stripe.Response<Stripe.SetupIntent>>>;
    [key: string]: any;
  };
  [key: string]: any;
}

// Mock Stripe globally for this test file
jest.mock('stripe', () => {
  console.log('Test file: Initializing custom Stripe mock');
  const stripeInstance: MockedStripeInstance = {
    setupIntents: {
      create: jest.fn()
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
  hasSetupIntents: !!stripeInstance.setupIntents,
  hasSetupIntentsCreate: !!stripeInstance.setupIntents?.create,
  stripeInstanceKeys: Object.keys(stripeInstance)
});

describe('Payment Controller - createSetupIntent', () => {
  beforeEach(async () => {
    if (!mockHelper.cleanTables) {
      mockHelper.cleanTables = jest.fn(() => Promise.resolve());
    }
    await mockHelper.cleanTables();
    resetMocks();
    jest.clearAllMocks();
    console.log('BeforeEach: After clearing mocks', {
      hasSetupIntentsCreate: !!stripeInstance.setupIntents.create,
      createMockCalls: stripeInstance.setupIntents.create.mock.calls.length,
      createMockImpl: !!stripeInstance.setupIntents.create.getMockImplementation()
    });
  });

  it('successfully creates a SetupIntent for an authenticated user', async () => {
    console.log('Test 1: Setting up mock for successful SetupIntent creation');
    stripeInstance.setupIntents.create.mockResolvedValue({
      id: 'seti_123',
      client_secret: 'seti_123_secret_xyz'
    } as Stripe.Response<Stripe.SetupIntent>);
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`Test 1: mockSupabase.from called with table: ${table}`);
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
        console.log(`Test 1: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 1: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 1: Calling createSetupIntent');
    await createSetupIntent(req as Request, res as Response);
    console.log('Test 1: createSetupIntent completed', {
      createCalls: stripeInstance.setupIntents.create.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.setupIntents.create).toHaveBeenCalledWith({
      customer: 'cus_123',
      payment_method_types: ['card'],
      metadata: { userId: 'user_123' }
    });
    expect(res.json).toHaveBeenCalledWith({ clientSecret: 'seti_123_secret_xyz' });
  });

  it('handles user not found when stripe_customer_id is missing', async () => {
    console.log('Test 2: Setting up no customer profile test');
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`Test 2: mockSupabase.from called with table: ${table}`);
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
        console.log(`Test 2: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 2: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 2: Calling createSetupIntent');
    await createSetupIntent(req as Request, res as Response);
    console.log('Test 2: createSetupIntent completed', {
      createCalls: stripeInstance.setupIntents.create.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.setupIntents.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('handles Stripe error during SetupIntent creation', async () => {
    console.log('Test 3: Setting up Stripe error test');
    stripeInstance.setupIntents.create.mockRejectedValue(new Error('Stripe API failure'));
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`Test 3: mockSupabase.from called with table: ${table}`);
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
        console.log(`Test 3: res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`Test 3: res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    console.log('Test 3: Calling createSetupIntent');
    await createSetupIntent(req as Request, res as Response);
    console.log('Test 3: createSetupIntent completed', {
      createCalls: stripeInstance.setupIntents.create.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.setupIntents.create).toHaveBeenCalledWith({
      customer: 'cus_123',
      payment_method_types: ['card'],
      metadata: { userId: 'user_123' }
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create setup intent' });
  });
});