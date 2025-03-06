/// <reference types="jest" />

import { getPaymentMethod } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { TABLES } from '../../../../config/tables';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import Stripe from 'stripe';

// Define a minimal mocked Stripe instance type
interface MockedStripeInstance {
  customers: {
    retrieve: jest.Mock<Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>>>;
    [key: string]: any;
  };
  paymentMethods: {
    list: jest.Mock<Promise<Stripe.ApiList<Stripe.PaymentMethod>>>;
    [key: string]: any;
  };
  [key: string]: any;
}

// Mock Stripe globally for this test file, overriding jest.setup.js
jest.mock('stripe', () => {
  console.log('Test file: Initializing custom Stripe mock');
  const stripeInstance: MockedStripeInstance = {
    customers: {
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_default' }) // Default value
    },
    paymentMethods: {
      list: jest.fn()
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

// Detailed initial logging
console.log('Test file: Global Stripe mock loaded:', {
  hasConstructor: !!stripe,
  hasCustomers: !!stripeInstance.customers,
  hasCustomersRetrieve: !!stripeInstance.customers?.retrieve,
  hasPaymentMethods: !!stripeInstance.paymentMethods,
  hasPaymentMethodsList: !!stripeInstance.paymentMethods?.list,
  stripeInstanceKeys: Object.keys(stripeInstance)
});

describe('Payment Controller - getPaymentMethod', () => {
  beforeEach(async () => {
    if (!mockHelper.cleanTables) {
      mockHelper.cleanTables = jest.fn(() => Promise.resolve());
    }
    await mockHelper.cleanTables();
    resetMocks();
    jest.clearAllMocks();
    console.log('BeforeEach: After clearing mocks', {
      hasCustomersRetrieve: !!stripeInstance.customers.retrieve,
      hasPaymentMethodsList: !!stripeInstance.paymentMethods.list,
      retrieveMockCalls: stripeInstance.customers.retrieve.mock.calls.length,
      listMockCalls: stripeInstance.paymentMethods.list.mock.calls.length,
      retrieveMockImpl: !!stripeInstance.customers.retrieve.getMockImplementation(),
      listMockImpl: !!stripeInstance.paymentMethods.list.getMockImplementation()
    });
  });

  it('returns the default payment method for an authenticated user', async () => {
    console.log('Test 1: Setting up mock for default payment method');
    stripeInstance.customers.retrieve.mockResolvedValue({
      id: 'cus_123',
      object: 'customer',
      invoice_settings: {
        default_payment_method: {
          id: 'pm_123',
          object: 'payment_method',
          card: { last4: '4242', brand: 'Visa', exp_month: 12, exp_year: 2025 },
          type: 'card'
        } as Stripe.PaymentMethod
      }
    } as Stripe.Response<Stripe.Customer>);
    console.log('Test 1: Mock setup complete', {
      retrieveMockResolved: !!stripeInstance.customers.retrieve.getMockImplementation(),
      listMockResolved: !!stripeInstance.paymentMethods.list.getMockImplementation()
    });

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

    console.log('Test 1: Calling getPaymentMethod');
    await getPaymentMethod(req as Request, res as Response);
    console.log('Test 1: getPaymentMethod completed', {
      retrieveCalls: stripeInstance.customers.retrieve.mock.calls,
      listCalls: stripeInstance.paymentMethods.list.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.customers.retrieve).toHaveBeenCalledWith('cus_123', {
      expand: ['invoice_settings.default_payment_method']
    });
    expect(res.json).toHaveBeenCalledWith({
      card: {
        last4: '4242',
        brand: 'Visa',
        exp_month: 12,
        exp_year: 2025
      }
    });
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

    console.log('Test 2: Calling getPaymentMethod');
    await getPaymentMethod(req as Request, res as Response);
    console.log('Test 2: getPaymentMethod completed', {
      retrieveCalls: stripeInstance.customers.retrieve.mock.calls,
      listCalls: stripeInstance.paymentMethods.list.mock.calls
    });

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(stripeInstance.customers.retrieve).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('handles users without payment methods', async () => {
    console.log('Test 3: Setting up mock for no payment methods');
    stripeInstance.customers.retrieve.mockResolvedValue({
      id: 'cus_123',
      object: 'customer',
      invoice_settings: { default_payment_method: null }
    } as Stripe.Response<Stripe.Customer>);
    stripeInstance.paymentMethods.list.mockResolvedValue({
      object: 'list',
      data: [],
      has_more: false,
      url: '/v1/payment_methods'
    } as Stripe.ApiList<Stripe.PaymentMethod>);
    console.log('Test 3: Mock setup complete', {
      retrieveMockResolved: !!stripeInstance.customers.retrieve.getMockImplementation(),
      listMockResolved: !!stripeInstance.paymentMethods.list.getMockImplementation()
    });

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

    console.log('Test 3: Calling getPaymentMethod');
    await getPaymentMethod(req as Request, res as Response);
    console.log('Test 3: getPaymentMethod completed', {
      retrieveCalls: stripeInstance.customers.retrieve.mock.calls,
      listCalls: stripeInstance.paymentMethods.list.mock.calls
    });

    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.USER_PROFILES);
    expect(stripeInstance.customers.retrieve).toHaveBeenCalledWith('cus_123', {
      expand: ['invoice_settings.default_payment_method']
    });
    expect(stripeInstance.paymentMethods.list).toHaveBeenCalledWith({
      customer: 'cus_123',
      type: 'card'
    });
    expect(res.json).toHaveBeenCalledWith({ card: null });
  });
});