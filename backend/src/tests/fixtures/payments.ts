export const paymentFixtures = {
  validCheckout: {
    priceId: 'price_H5ggYwtDq4fbrJ',
    successUrl: 'http://localhost:3000/success',
    cancelUrl: 'http://localhost:3000/cancel'
  },

  validSubscriptions: {
    monthly: {
      priceId: 'price_monthly123',
      interval: 'month',
      amount: 999, // $9.99
      currency: 'usd',
      productId: 'prod_monthly123'
    },
    yearly: {
      priceId: 'price_yearly123',
      interval: 'year',
      amount: 9900, // $99.00
      currency: 'usd',
      productId: 'prod_yearly123'
    }
  },

  stripeResponses: {
    successfulSession: {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      object: 'checkout.session',
      status: 'open',
      metadata: {}
    },
    successfulSubscription: {
      id: 'sub_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      customer: 'cus_123'
    },
    errorResponses: {
      invalidPriceId: new Error('Invalid price ID provided'),
      apiError: new Error('Stripe API Error'),
      authenticationError: new Error('Invalid API Key provided')
    }
  },

  invalidCheckouts: {
    missingPriceId: {
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel'
    },
    invalidPriceId: {
      priceId: 'invalid_price',
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel'
    },
    missingUrls: {
      priceId: 'price_H5ggYwtDq4fbrJ'
    }
  }
};

// Helper to generate unique payment data with proper typing
export interface UniquePayment {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: string;
}

export const generateUniquePayment = (type: 'subscription' | 'onetime' = 'subscription'): UniquePayment => ({
  priceId: `price_${Date.now()}`,
  successUrl: `http://localhost:3000/success?session=${Date.now()}`,
  cancelUrl: `http://localhost:3000/cancel?session=${Date.now()}`,
  customerId: `cus_${Date.now()}`,
  subscriptionId: type === 'subscription' ? `sub_${Date.now()}` : undefined,
  amount: 999,
  currency: 'usd',
  status: 'pending'
});

// Helper to generate test subscription data
export const generateTestSubscription = (status: 'active' | 'canceled' | 'past_due' = 'active') => ({
  id: `sub_${Date.now()}`,
  customer: `cus_${Date.now()}`,
  status,
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  plan: {
    id: `plan_${Date.now()}`,
    amount: 999,
    currency: 'usd',
    interval: 'month'
  }
}); 