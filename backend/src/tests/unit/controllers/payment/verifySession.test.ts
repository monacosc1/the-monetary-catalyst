/// <reference types="jest" />

import { verifySession } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { TABLES } from '../../../../config/tables';
import Stripe from 'stripe';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const stripe = jest.requireMock('stripe') as {
  checkout: {
    sessions: {
      retrieve: jest.Mock<Promise<Stripe.Response<Stripe.Checkout.Session>>>;
    };
  };
};

describe('Payment Controller - verifySession', () => {
  beforeEach(async () => {
    if (!mockHelper.cleanTables) {
      mockHelper.cleanTables = jest.fn(() => Promise.resolve());
    }
    await mockHelper.cleanTables();
    resetMocks();
    jest.clearAllMocks();
    console.log('Pre-test Stripe mock state:', {
      hasCheckout: !!stripe.checkout,
      hasSessionsRetrieve: !!stripe.checkout?.sessions?.retrieve
    });
  });

  it('verifies a successful session', async () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_123',
      object: 'checkout.session',
      payment_status: 'paid',
      status: 'complete',
      subscription: 'sub_123',
      customer: 'cus_123',
      amount_total: 1000, // Required field
      amount_subtotal: 1000, // Required field
      total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 } // Required field
    };
    stripe.checkout.sessions.retrieve.mockResolvedValue(mockSession as Stripe.Response<Stripe.Checkout.Session>);
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`mockSupabase.from called with table: ${table}`);
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'sub_789', stripe_subscription_id: 'sub_123' },
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        } as PostgrestSingleResponse<any>)
      };
    });

    const req: Partial<Request> = {
      query: { session_id: 'cs_123' },
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    await verifySession(req as Request, res as Response);

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_123');
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      status: 'complete',
      paymentStatus: 'paid',
      subscription: { id: 'sub_789', stripe_subscription_id: 'sub_123' }
    });
  });

  it('handles invalid session ID', async () => {
    const req: Partial<Request> = {
      query: { session_id: undefined }, // Changed from null to undefined
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    await verifySession(req as Request, res as Response);

    expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid session ID' });
  });

  it('handles session verification failure', async () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_123',
      object: 'checkout.session',
      payment_status: 'unpaid',
      status: 'open',
      subscription: null,
      amount_total: 1000, // Required field
      amount_subtotal: 1000, // Required field
      total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 } // Required field
    };
    stripe.checkout.sessions.retrieve.mockResolvedValue(mockSession as Stripe.Response<Stripe.Checkout.Session>);
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`mockSupabase.from called with table: ${table}`);
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No subscription found' },
          count: null,
          status: 404,
          statusText: 'Not Found'
        } as PostgrestSingleResponse<any>)
      };
    });

    const req: Partial<Request> = {
      query: { session_id: 'cs_123' },
      user: { id: 'user_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>
    };

    await verifySession(req as Request, res as Response);

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_123');
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Payment incomplete',
      status: 'open',
      paymentStatus: 'unpaid'
    });
  });
});