/// <reference types="jest" />

import { handleWebhook } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks, createMockQueryBuilder } from '../../../helpers/mocks';
import { TABLES } from '../../../../config/tables';
import Stripe from 'stripe';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const stripe = jest.requireMock('stripe') as {
  webhooks: {
    constructEvent: jest.Mock<Stripe.Event>;
  };
  subscriptions: {
    retrieve: jest.Mock<Promise<Stripe.Response<Stripe.Subscription>>>;
  };
  invoices: {
    retrieve: jest.Mock<Promise<Stripe.Response<Stripe.Invoice>>>;
  };
};

describe('Payment Controller - handleWebhook', () => {
  beforeEach(async () => {
    if (!mockHelper.cleanTables) {
      mockHelper.cleanTables = jest.fn(() => Promise.resolve());
    }
    await mockHelper.cleanTables();
    resetMocks();
    jest.clearAllMocks();
    console.log('Pre-test Stripe mock state:', {
      hasWebhooks: !!stripe.webhooks,
      hasConstructEvent: !!stripe.webhooks?.constructEvent,
      hasSubscriptionsRetrieve: !!stripe.subscriptions?.retrieve,
      hasInvoicesRetrieve: !!stripe.invoices?.retrieve
    });
  });

  it('processes checkout.session.completed event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_123',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          subscription: 'sub_123',
          client_reference_id: 'user_123',
          payment_intent: 'pi_456',
          invoice: 'in_789',
          customer: 'cus_123'
        } as Stripe.Checkout.Session
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      account: undefined
    };
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    stripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_123',
      object: 'subscription',
      customer: 'cus_123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: { data: [{ id: 'si_123', price: { id: 'price_456', recurring: { interval: 'month' } } }] }
    } as Stripe.Response<Stripe.Subscription>);
    stripe.invoices.retrieve.mockResolvedValue({
      id: 'in_789',
      object: 'invoice',
      payment_intent: 'pi_456',
      amount_paid: 3500
    } as Stripe.Response<Stripe.Invoice>);

    const qbSubscriptions = createMockQueryBuilder(TABLES.SUBSCRIPTIONS);
    qbSubscriptions.insert.mockReturnValue(qbSubscriptions);
    qbSubscriptions.select.mockReturnValue(qbSubscriptions);
    qbSubscriptions.single.mockResolvedValue({
      data: { id: 'sub_789' },
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<any>);

    const qbPayments = createMockQueryBuilder(TABLES.PAYMENTS);
    qbPayments.insert.mockReturnValue(qbPayments);
    qbPayments.select.mockReturnValue(qbPayments);
    qbPayments.single.mockResolvedValue({
      data: { id: 'pay_123' },
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<any>);

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`mockSupabase.from called with table: ${table}`);
      if (table === TABLES.SUBSCRIPTIONS) return qbSubscriptions;
      if (table === TABLES.PAYMENTS) return qbPayments;
      return createMockQueryBuilder(table);
    });

    const req: Partial<Request> = {
      body: Buffer.from(JSON.stringify(mockEvent.data.object)),
      headers: { 'stripe-signature': 'sig_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response; // Explicit return for chaining
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response; // Return full Response
      }) as jest.MockedFunction<(code: number) => Response>,
      send: jest.fn((data) => {
        console.log(`res.send called with: ${data}`);
        return res as Response; // Return full Response
      }) as jest.MockedFunction<(data: any) => Response>
    };

    await handleWebhook(req as Request, res as Response);

    console.log('Post-call Stripe calls:', {
      constructEventCalls: stripe.webhooks.constructEvent.mock.calls,
      subscriptionsRetrieveCalls: stripe.subscriptions.retrieve.mock.calls,
      invoicesRetrieveCalls: stripe.invoices.retrieve.mock.calls
    });

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      req.body,
      'sig_123',
      process.env.STRIPE_WEBHOOK_SECRET
    );
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.PAYMENTS);
    expect(qbSubscriptions.insert).toHaveBeenCalled();
    expect(qbPayments.insert).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('processes customer.subscription.deleted event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_456',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          current_period_end: Math.floor(Date.now() / 1000)
        } as Stripe.Subscription
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      account: undefined
    };
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const qb = createMockQueryBuilder(TABLES.SUBSCRIPTIONS);
    qb.update.mockReturnValue(qb);
    qb.eq.mockReturnValue(qb);
    qb.single.mockResolvedValue({
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<any>);
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`mockSupabase.from called with table: ${table}`);
      return qb;
    });

    const req: Partial<Request> = {
      body: Buffer.from(JSON.stringify(mockEvent.data.object)),
      headers: { 'stripe-signature': 'sig_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>,
      send: jest.fn((data) => {
        console.log(`res.send called with: ${data}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>
    };

    await handleWebhook(req as Request, res as Response);

    console.log('Post-call Stripe calls:', {
      constructEventCalls: stripe.webhooks.constructEvent.mock.calls
    });

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      req.body,
      'sig_123',
      process.env.STRIPE_WEBHOOK_SECRET
    );
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(qb.update).toHaveBeenCalledWith({
      status: 'expired',
      payment_status: 'cancelled',
      updated_at: expect.any(String),
      end_date: expect.any(String)
    });
    expect(qb.eq).toHaveBeenCalledWith('stripe_subscription_id', 'sub_123');
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('processes invoice.payment_succeeded event', async () => {
    jest.setTimeout(10000);

    const mockEvent: Stripe.Event = {
      id: 'evt_789',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_456',
          amount_paid: 3500,
          payment_intent: 'pi_789'
        } as Stripe.Invoice
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      account: undefined
    };
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    stripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_123',
      object: 'subscription',
      customer: 'cus_456',
      status: 'active',
      metadata: { userId: 'user_123' },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: { data: [] }
    } as unknown as Stripe.Response<Stripe.Subscription>);

    const qbSubscriptions = createMockQueryBuilder(TABLES.SUBSCRIPTIONS);
    qbSubscriptions.select.mockReturnValue(qbSubscriptions);
    qbSubscriptions.single.mockImplementationOnce(() =>
      Promise.resolve({
        data: { id: 'sub_789', user_id: 'user_123', stripe_subscription_id: 'sub_123' },
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<any>)
    ); // First call for select
    qbSubscriptions.update.mockReturnValue(qbSubscriptions);
    qbSubscriptions.eq.mockReturnValue(qbSubscriptions);
    qbSubscriptions.single.mockResolvedValue({
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<any>); // Second call for update

    const qbPayments = createMockQueryBuilder(TABLES.PAYMENTS);
    qbPayments.insert.mockReturnValue(qbPayments);
    qbPayments.select.mockReturnValue(qbPayments);
    qbPayments.single.mockResolvedValue({
      data: { id: 'pay_123' },
      error: null,
      count: null,
      status: 200,
      statusText: 'OK'
    } as PostgrestSingleResponse<any>);

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      console.log(`mockSupabase.from called with table: ${table}`);
      if (table === TABLES.SUBSCRIPTIONS) return qbSubscriptions;
      if (table === TABLES.PAYMENTS) return qbPayments;
      return createMockQueryBuilder(table);
    });

    const req: Partial<Request> = {
      body: Buffer.from(JSON.stringify(mockEvent.data.object)),
      headers: { 'stripe-signature': 'sig_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response; // Explicitly return Response for chaining
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response; // Return full Response
      }) as jest.MockedFunction<(code: number) => Response>,
      send: jest.fn((data) => {
        console.log(`res.send called with: ${data}`);
        return res as Response; // Return full Response
      }) as jest.MockedFunction<(data: any) => Response>
    };

    await handleWebhook(req as Request, res as Response);

    console.log('Post-call Stripe calls:', {
      constructEventCalls: stripe.webhooks.constructEvent.mock.calls,
      subscriptionsRetrieveCalls: stripe.subscriptions.retrieve.mock.calls
    });

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      req.body,
      'sig_123',
      process.env.STRIPE_WEBHOOK_SECRET
    );
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.SUBSCRIPTIONS);
    expect(mockSupabase.from).toHaveBeenCalledWith(TABLES.PAYMENTS);
    expect(qbPayments.insert).toHaveBeenCalled();
    expect(qbSubscriptions.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  }, 10000);

  it('handles invalid signature', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req: Partial<Request> = {
      body: Buffer.from('{}'),
      headers: { 'stripe-signature': 'invalid' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => {
        console.log(`res.json called with: ${JSON.stringify(data)}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>,
      status: jest.fn((code) => {
        console.log(`res.status called with: ${code}`);
        return res as Response;
      }) as jest.MockedFunction<(code: number) => Response>,
      send: jest.fn((data) => {
        console.log(`res.send called with: ${data}`);
        return res as Response;
      }) as jest.MockedFunction<(data: any) => Response>
    };

    await handleWebhook(req as Request, res as Response);

    console.log('Post-call Stripe calls:', {
      constructEventCalls: stripe.webhooks.constructEvent.mock.calls
    });

    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      req.body,
      'invalid',
      process.env.STRIPE_WEBHOOK_SECRET
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Webhook Error: Invalid signature');
  });
});