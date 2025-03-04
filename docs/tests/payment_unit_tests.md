# The Monetary Catalyst - Payment Unit Test Recommendations

This document provides a detailed and extensive recommendation for unit tests to ensure the robustness of The Monetary Catalyst’s Stripe payment integration. These tests are designed for junior developers to implement using Jest, targeting key backend endpoints in `/backend/controllers/paymentController.ts` and related files. Each test case includes the purpose, implementation details, and expected outcomes.

## Overview
The payment integration handles subscription checkout, webhooks, session verification, payment method management, and recurring payments. We’ll test critical endpoints to verify functionality, error handling, and edge cases in a production-ready manner.

## Testing Setup
- **Framework**: Use Jest with `@types/jest` for TypeScript support.
- **Dependencies**:
  - `npm install --save-dev jest @types/jest @supabase/supabase-js stripe-mock express-rate-limit @sentry/node p-retry`
- **Configuration** (`package.json`):
  ```json
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node"
  }

## Unit Tests
### 1. createCheckoutSession (in paymentController.ts)
Purpose: Verify that an authenticated user can create a Stripe Checkout session, handle unauthorized users, and manage customer creation.

Implementation:
describe('createCheckoutSession', () => {
  it('creates a checkout session for an authenticated user', async () => {
    const mockSession = { url: 'https://checkout.stripe.com/...' };
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' } }),
      update: jest.fn().mockResolvedValue({}),
    });

    const req = { 
      user: { id: 'user_123', email: 'test@example.com' }, 
      body: { priceId: 'price_456' }
    } as AuthenticatedRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await createCheckoutSession(req, res);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: 'cus_123',
      line_items: [{ price: 'price_456', quantity: 1 }],
      success_url: expect.stringContaining('/success'),
      cancel_url: expect.stringContaining('/pricing'),
    });
    expect(res.json).toHaveBeenCalledWith({ url: mockSession.url });
  });

  it('handles unauthorized users', async () => {
    const req = { user: undefined } as AuthenticatedRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await createCheckoutSession(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('creates a new customer when none exists', async () => {
    (stripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_new' });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: null }),
      update: jest.fn().mockResolvedValue({}),
    });

    const req = { 
      user: { id: 'user_123', email: 'test@example.com' }, 
      body: { priceId: 'price_456' }
    } as AuthenticatedRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await createCheckoutSession(req, res);
    expect(stripe.customers.create).toHaveBeenCalledWith({
      email: 'test@example.com',
      metadata: { userId: 'user_123' },
    });
    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
  });
});

Expected Outcomes: Ensures correct session creation, error handling, and customer management.

### 2. handleWebhook (in paymentController.ts)
Purpose: Test webhook event processing for checkout.session.completed, customer.subscription.deleted, invoice.payment_succeeded, and error cases.
Implementation:

describe('handleWebhook', () => {
  it('processes checkout.session.completed event', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: { subscription: 'sub_123', client_reference_id: 'user_123', payment_intent: 'pi_456', invoice: 'in_789' } as Stripe.Checkout.Session },
    };
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({ items: { data: [{ price: { recurring: { interval: 'month' } } }] } as Stripe.Subscription);
    (stripe.invoices.retrieve as jest.Mock).mockResolvedValue({ payment_intent: 'pi_456' } as Stripe.Invoice);
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: { id: 'sub_789' } }),
      select: jest.fn().mockResolvedValue({}),
    });

    const req = { body: JSON.stringify(mockEvent.data.object), headers: { 'stripe-signature': 'sig_123' }} as Request;
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;

    await handleWebhook(req, res);
    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('processes customer.subscription.deleted event', async () => {
    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_123', current_period_end: Math.floor(Date.now() / 1000) } as Stripe.Subscription },
    };
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
    (supabase.from as jest.Mock).mockReturnValue({
      update: jest.fn().mockResolvedValue({}),
    });

    const req = { body: JSON.stringify(mockEvent.data.object), headers: { 'stripe-signature': 'sig_123' }} as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await handleWebhook(req, res);
    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('processes invoice.payment_succeeded event', async () => {
    const mockEvent = {
      type: 'invoice.payment_succeeded',
      data: { object: { subscription: 'sub_123', customer: 'cus_456', amount_paid: 3500 } as Stripe.Invoice },
    };
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({ metadata: { userId: 'user_123' } } as Stripe.Subscription);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: { id: 'sub_789' } }),
      insert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    });

    const req = { body: JSON.stringify(mockEvent.data.object), headers: { 'stripe-signature': 'sig_123' }} as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await handleWebhook(req, res);
    expect(supabase.from).toHaveBeenCalledWith('payments');
    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('handles invalid signature', async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => { throw new Error('Invalid signature'); });
    const req = { body: '{}', headers: { 'stripe-signature': 'invalid' }} as Request;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;

    await handleWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Webhook Error: Invalid signature');
  });
});

Expected Outcomes: Ensures webhook events are processed correctly, updates databases as expected, and handles errors.

### 3. verifySession (in paymentController.ts)

Purpose: Test session verification for successful and failed payments.
Implementation:
describe('verifySession', () => {
  it('verifies a successful session', async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_status: 'paid',
      status: 'complete',
      subscription: 'sub_123',
    } as Stripe.Checkout.Session);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: {} }),
    });

    const req = { query: { session_id: 'cs_123' }, user: { id: 'user_123' }} as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await verifySession(req, res);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      status: 'complete',
      paymentStatus: 'paid',
      subscription: {},
    });
  });

  it('handles invalid session ID', async () => {
    const req = { query: { session_id: null }, user: { id: 'user_123' }} as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await verifySession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid session ID' });
  });

  it('handles session verification failure', async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_status: 'unpaid',
      status: 'open',
    } as Stripe.Checkout.Session);

    const req = { query: { session_id: 'cs_123' }, user: { id: 'user_123' }} as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await verifySession(req, res);
    expect(res.json).toHaveBeenCalledWith({ 
      success: false, 
      message: 'Payment incomplete',
      status: 'open',
      paymentStatus: 'unpaid',
    });
  });
});

Expected Outcomes: Ensures session verification works for both successful and failed cases.

### 4. getPaymentMethod (in paymentController.ts)
Purpose: Test retrieving the default payment method for authenticated users and handle edge cases.
Implementation:
describe('getPaymentMethod', () => {
  it('returns the default payment method for an authenticated user', async () => {
    (stripe.paymentMethods.list as jest.Mock).mockResolvedValue({ data: [{ card: { last4: '4242', brand: 'Visa', exp_month: 12, exp_year: 2025 } }] } as Stripe.ApiList<Stripe.PaymentMethod>);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' } }),
    });

    const req = { user: { id: 'user_123' }} as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await getPaymentMethod(req, res);
    expect(res.json).toHaveBeenCalledWith({
      card: {
        last4: '4242',
        brand: 'Visa',
        exp_month: 12,
        exp_year: 2025,
      },
    });
  });

  it('handles unauthorized users', async () => {
    const req = { user: undefined } as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await getPaymentMethod(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('handles users without payment methods', async () => {
    (stripe.paymentMethods.list as jest.Mock).mockResolvedValue({ data: [] } as Stripe.ApiList<Stripe.PaymentMethod>);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' } }),
    });

    const req = { user: { id: 'user_123' }} as Request;
    const res = { json: jest.fn() } as unknown as Response;

    await getPaymentMethod(req, res);
    expect(res.json).toHaveBeenCalledWith({ card: null });
  });
});

Expected Outcomes: Ensures correct payment method retrieval and error handling

### 5. cancelSubscription (in paymentController.ts)

Purpose: Test subscription cancellation for authenticated users and handle edge cases.
Implementation:

describe('cancelSubscription', () => {
  it('cancels an active subscription for an authenticated user', async () => {
    (stripe.subscriptions.list as jest.Mock).mockResolvedValue({ data: [{ id: 'sub_123' }] } as Stripe.ApiList<Stripe.Subscription>);
    (stripe.subscriptions.update as jest.Mock).mockResolvedValue({});
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' } }),
      update: jest.fn().mockResolvedValue({}),
    });

    const req = { user: { id: 'user_123' }} as AuthenticatedRequest;
    const res = { json: jest.fn() } as unknown as Response;

    await cancelSubscription(req, res);
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_123', { cancel_at_period_end: true });
    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('handles unauthorized users', async () => {
    const req = { user: undefined } as AuthenticatedRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await cancelSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('handles users without active subscriptions', async () => {
    (stripe.subscriptions.list as jest.Mock).mockResolvedValue({ data: [] } as Stripe.ApiList<Stripe.Subscription>);
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' } }),
    });

    const req = { user: { id: 'user_123' }} as AuthenticatedRequest;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    await cancelSubscription(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No active subscription found in Stripe' });
  });
});

Expected Outcomes: Ensures subscription cancellation works and handles errors.