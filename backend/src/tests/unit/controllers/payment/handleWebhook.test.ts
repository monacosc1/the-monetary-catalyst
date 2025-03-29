// src/tests/unit/controllers/payment/handleWebhook.test.ts
/// <reference types="jest" />

import { handleWebhook } from '../../../../controllers/paymentController';
import { mockHelper, mockSupabase, resetMocks, createMockQueryBuilder } from '../../../helpers/mocks';
import { TABLES } from '../../../../config/tables';
import Stripe from 'stripe';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const stripe = jest.requireMock('stripe') as {
  webhooks: { constructEvent: jest.Mock<Stripe.Event> };
  subscriptions: {
    retrieve: jest.Mock<Promise<Stripe.Response<Stripe.Subscription>>>;
    list: jest.Mock<Promise<Stripe.Response<Stripe.ApiList<Stripe.Subscription>>>>;
    update: jest.Mock<Promise<Stripe.Response<Stripe.Subscription>>>;
  };
  invoices: { retrieve: jest.Mock<Promise<Stripe.Response<Stripe.Invoice>>> };
  customers: { update: jest.Mock<Promise<Stripe.Response<Stripe.Customer>>> };
};

// Helper functions (createMockPlan, createMockPrice, createMockSubscriptionItem, createMockSubscription) remain unchanged
const createMockPlan = (): Stripe.Plan => ({
  id: 'plan_123',
  object: 'plan',
  active: true,
  billing_scheme: 'per_unit',
  created: Math.floor(Date.now() / 1000),
  currency: 'usd',
  interval: 'month',
  interval_count: 1,
  livemode: false,
  metadata: {},
  nickname: null,
  product: 'prod_123',
  tiers_mode: null,
  transform_usage: null,
  trial_period_days: null,
  amount: 3500,
  amount_decimal: '3500',
  aggregate_usage: null,
  meter: null,
  usage_type: 'metered'
});

const createMockPrice = (): Stripe.Price => ({
  id: 'price_456',
  object: 'price',
  active: true,
  billing_scheme: 'per_unit',
  created: Math.floor(Date.now() / 1000),
  currency: 'usd',
  custom_unit_amount: null,
  livemode: false,
  lookup_key: null,
  metadata: {},
  nickname: null,
  product: 'prod_123',
  recurring: {
    interval: 'month',
    interval_count: 1,
    usage_type: 'metered',
    aggregate_usage: null,
    trial_period_days: null,
    meter: null
  },
  tax_behavior: 'unspecified',
  tiers_mode: null,
  transform_quantity: null,
  type: 'recurring',
  unit_amount: 3500,
  unit_amount_decimal: '3500'
});

const createMockSubscriptionItem = (): Stripe.SubscriptionItem => ({
  id: 'si_123',
  object: 'subscription_item',
  billing_thresholds: null,
  created: Math.floor(Date.now() / 1000),
  metadata: {},
  price: createMockPrice(),
  quantity: 1,
  subscription: 'sub_123',
  tax_rates: [],
  discounts: [],
  plan: createMockPlan()
});

const createMockSubscription = (opts: { hasItems?: boolean } = {}): Stripe.Subscription => {
  const endBehavior = 'release' as unknown as Stripe.Subscription.TrialSettings.EndBehavior;
  return {
    id: 'sub_123',
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: {
      enabled: false,
      liability: null,
      disabled_reason: 'requires_location_inputs', // Add the required property
    },
    billing_cycle_anchor: Math.floor(Date.now() / 1000),
    billing_cycle_anchor_config: null,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_details: {
      comment: null,
      feedback: null,
      reason: null
    },
    collection_method: 'charge_automatically',
    created: Math.floor(Date.now() / 1000),
    currency: 'usd',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    current_period_start: Math.floor(Date.now() / 1000),
    customer: 'cus_123',
    days_until_due: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    discounts: [],
    ended_at: null,
    invoice_settings: {
      account_tax_ids: null,
      issuer: { type: 'self' }
    },
    items: {
      object: 'list',
      data: opts.hasItems ? [createMockSubscriptionItem()] : [],
      has_more: false,
      url: '/v1/subscription_items'
    },
    latest_invoice: null,
    livemode: false,
    metadata: opts.hasItems ? {} : { userId: 'user_123' },
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: 'off'
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    schedule: null,
    start_date: Math.floor(Date.now() / 1000),
    status: 'active',
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_settings: {
      end_behavior: endBehavior
    },
    trial_start: null
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
    if (stripe.subscriptions.retrieve) {
      stripe.subscriptions.retrieve.mockReset();
    }
    console.log('Pre-test Stripe mock state:', {
      hasWebhooks: !!stripe.webhooks,
      hasConstructEvent: !!stripe.webhooks?.constructEvent,
      hasSubscriptionsRetrieve: !!stripe.subscriptions?.retrieve,
      hasInvoicesRetrieve: !!stripe.invoices?.retrieve
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    return Promise.resolve(); // Ensure all pending promises are resolved
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
    const mockSubscription = createMockSubscription({ hasItems: true });
    stripe.subscriptions.retrieve.mockResolvedValue(mockSubscription as Stripe.Response<Stripe.Subscription>);
    stripe.invoices.retrieve.mockResolvedValue({
      id: 'in_789',
      object: 'invoice',
      payment_intent: 'pi_456',
      amount_paid: 3500
    } as Stripe.Response<Stripe.Invoice>);

    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: { subscription_id: 'sub_789' },
      error: null
    });

    const req: Partial<Request> = {
      body: Buffer.from(JSON.stringify(mockEvent.data.object)),
      headers: { 'stripe-signature': 'sig_123' }
    };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    await handleWebhook(req as Request, res as Response);
    await (req as any).asyncProcessing;
    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(mockSupabase.rpc).toHaveBeenCalledWith('create_subscription_and_payment', {
      p_user_id: 'user_123',
      p_stripe_subscription_id: 'sub_123',
      p_plan_type: 'monthly',
      p_payment_intent: 'pi_456',
      p_amount: 35
    });
  });

  it('processes customer.subscription.deleted event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_456',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_123', current_period_end: Math.floor(Date.now() / 1000) } as Stripe.Subscription
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
    qb.single.mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: 'OK' } as PostgrestSingleResponse<any>);
    (mockSupabase.from as jest.Mock).mockReturnValue(qb);

    const req: Partial<Request> = { body: Buffer.from(JSON.stringify(mockEvent.data.object)), headers: { 'stripe-signature': 'sig_123' } };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    await handleWebhook(req as Request, res as Response);
    await (req as any).asyncProcessing;
    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(qb.update).toHaveBeenCalled();
  });

  it('processes invoice.payment_succeeded event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_789',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'invoice.payment_succeeded',
      data: {
        object: { subscription: 'sub_123', customer: 'cus_456', amount_paid: 3500, payment_intent: 'pi_789' } as Stripe.Invoice
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      account: undefined
    };
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    const mockSubscription = createMockSubscription();
    stripe.subscriptions.retrieve.mockResolvedValue(mockSubscription as Stripe.Response<Stripe.Subscription>);

    const qbSubscriptions = createMockQueryBuilder(TABLES.SUBSCRIPTIONS);
    qbSubscriptions.select.mockReturnValue(qbSubscriptions);
    qbSubscriptions.single.mockResolvedValueOnce({ data: { id: 'sub_789', user_id: 'user_123' }, error: null, count: null, status: 200, statusText: 'OK' } as PostgrestSingleResponse<any>);
    qbSubscriptions.update.mockReturnValue(qbSubscriptions);
    qbSubscriptions.single.mockResolvedValueOnce({ data: null, error: null, count: null, status: 200, statusText: 'OK' } as PostgrestSingleResponse<any>);

    const qbPayments = createMockQueryBuilder(TABLES.PAYMENTS);
    qbPayments.insert.mockImplementation((...args: any[]) => {
      console.log(`insert called for table "${TABLES.PAYMENTS}" with arguments:`, args);
      return qbPayments;
    });
    qbPayments.select.mockReturnValue(qbPayments);
    qbPayments.maybeSingle.mockResolvedValue({ data: null, error: null, count: null, status: 200, statusText: 'OK' } as PostgrestSingleResponse<any>);

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === TABLES.SUBSCRIPTIONS) return qbSubscriptions;
      if (table === TABLES.PAYMENTS) return qbPayments;
      return createMockQueryBuilder(table);
    });

    const req: Partial<Request> = { body: Buffer.from(JSON.stringify(mockEvent.data.object)), headers: { 'stripe-signature': 'sig_123' } };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    await handleWebhook(req as Request, res as Response);
    await (req as any).asyncProcessing;
    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(qbPayments.insert).toHaveBeenCalled();
  });

  it('handles invalid signature', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => { throw new Error('Invalid signature'); });
    const req: Partial<Request> = { body: Buffer.from('{}'), headers: { 'stripe-signature': 'invalid' } };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    await handleWebhook(req as Request, res as Response);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Webhook Error: Invalid signature');
  });

  it('processes setup_intent.succeeded event', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_setup',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'setup_intent.succeeded',
      data: {
        object: { customer: 'cus_123', payment_method: 'pm_123' } as Stripe.SetupIntent
      },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      account: undefined
    };
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    stripe.customers.update.mockResolvedValue({ id: 'cus_123' } as Stripe.Response<Stripe.Customer>);
    stripe.subscriptions.list.mockResolvedValue({ data: [{ id: 'sub_123' }], has_more: false, url: '/v1/subscriptions', object: 'list' } as Stripe.Response<Stripe.ApiList<Stripe.Subscription>>);
    stripe.subscriptions.update.mockResolvedValue({ id: 'sub_123' } as Stripe.Response<Stripe.Subscription>);

    const req: Partial<Request> = { body: Buffer.from(JSON.stringify(mockEvent.data.object)), headers: { 'stripe-signature': 'sig_123' } };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    await handleWebhook(req as Request, res as Response);
    await (req as any).asyncProcessing;
    expect(stripe.webhooks.constructEvent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(stripe.customers.update).toHaveBeenCalled();
  });

  it('handles checkout.session.completed with payment failure', async () => {
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
    const mockSubscription = createMockSubscription({ hasItems: true });
    stripe.subscriptions.retrieve.mockResolvedValue(mockSubscription as Stripe.Response<Stripe.Subscription>);
    stripe.invoices.retrieve.mockResolvedValue({
      id: 'in_789',
      payment_intent: 'pi_456',
      amount_paid: 3500
    } as Stripe.Response<Stripe.Invoice>);

    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('RPC failed')
    });

    const req: Partial<Request> = { body: Buffer.from(JSON.stringify(mockEvent.data.object)), headers: { 'stripe-signature': 'sig_123' } };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    await handleWebhook(req as Request, res as Response);
    await expect((req as any).asyncProcessing).rejects.toThrow('Failed to create subscription and payment via RPC: RPC failed');
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('responds before async processing', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_timing',
      object: 'event',
      api_version: '2024-09-30.acacia',
      created: Math.floor(Date.now() / 1000),
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123', subscription: 'sub_123', client_reference_id: 'user_123' } as Stripe.Checkout.Session },
      livemode: false,
      pending_webhooks: 1,
      request: null,
      account: undefined
    };
    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    const mockSubscription = createMockSubscription({ hasItems: true });
    stripe.subscriptions.retrieve.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockSubscription as Stripe.Response<Stripe.Subscription>), 100)));
    stripe.invoices.retrieve.mockResolvedValue({
      id: 'in_789',
      object: 'invoice',
      payment_intent: 'pi_456',
      amount_paid: 3500
    } as Stripe.Response<Stripe.Invoice>);

    (mockSupabase.rpc as jest.Mock).mockResolvedValue({
      data: { subscription_id: 'sub_789' },
      error: null
    });

    const req: Partial<Request> = { body: Buffer.from(JSON.stringify(mockEvent.data.object)), headers: { 'stripe-signature': 'sig_123' } };
    const res: Partial<Response> = {
      json: jest.fn((data) => res as Response),
      status: jest.fn((code: number) => res as Response),
      send: jest.fn((data) => res as Response)
    };

    const promise = handleWebhook(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith({ received: true });
    await promise;
    await (req as any).asyncProcessing;
  });
});