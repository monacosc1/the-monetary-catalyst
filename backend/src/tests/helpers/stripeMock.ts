// src/tests/helpers/stripeMock.ts
import Stripe from 'stripe';

export const createStripeMock = (): jest.Mocked<Stripe> => ({
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        object: 'checkout.session',
        status: 'open',
        metadata: {}
      }),
      retrieve: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      list: jest.fn().mockResolvedValue({ data: [] }),
      expire: jest.fn().mockResolvedValue({}),
      listLineItems: jest.fn().mockResolvedValue({ data: [] })
    }
  },
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_new123',
      email: 'test@example.com'
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'cus_existing123'
    }),
    list: jest.fn().mockResolvedValue({ data: [] }),
    update: jest.fn().mockResolvedValue({}),
    del: jest.fn().mockResolvedValue({}),
    createBalanceTransaction: jest.fn(),
    createFundingInstructions: jest.fn(),
    createSource: jest.fn(),
    createTaxId: jest.fn(),
    deleteDiscount: jest.fn(),
    listPaymentMethods: jest.fn().mockResolvedValue({ data: [] }),
    listBalanceTransactions: jest.fn().mockResolvedValue({ data: [] }),
    listSources: jest.fn().mockResolvedValue({ data: [] }),
    listTaxIds: jest.fn().mockResolvedValue({ data: [] }),
    search: jest.fn().mockResolvedValue({ data: [] })
  },
  subscriptions: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'sub_123',
      object: 'subscription',
      customer: 'cus_456',
      status: 'active',
      metadata: { userId: 'user_123' },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      billing_cycle_anchor: Math.floor(Date.now() / 1000),
      items: { data: [] }
    } as unknown as Stripe.Response<Stripe.Subscription>), // Cast to unknown first
    list: jest.fn().mockResolvedValue({ data: [] }),
    update: jest.fn().mockResolvedValue({})
  },
  invoices: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'in_789',
      object: 'invoice',
      payment_intent: 'pi_789'
    } as Stripe.Response<Stripe.Invoice>)
  },
  webhooks: {
    constructEvent: jest.fn()
  }
} as unknown) as jest.Mocked<Stripe>;