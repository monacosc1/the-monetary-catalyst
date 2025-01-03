# Stripe Integration Documentation

## Overview
The Monetary Catalyst uses Stripe for payment processing and subscription management. The integration handles payment methods, subscriptions, webhooks, and customer management.

## Configuration

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
```

### Stripe Client Setup
```typescript
// services/stripeService.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

export default stripe;
```

## Customer Management

### Customer Creation
```typescript
async function createOrGetCustomer(userId: string, email: string) {
  // Check existing customer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId
    }
  });

  // Save customer ID
  await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}
```

## Payment Processing

### Checkout Session
```typescript
async function createCheckoutSession(
  customerId: string,
  priceId: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: `${process.env.FRONTEND_URL}/checkout/success`,
    cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`
  });
}
```

### Setup Intent
```typescript
async function createSetupIntent(customerId: string) {
  return await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card']
  });
}
```

## Subscription Management

### Create Subscription
```typescript
async function createSubscription(
  customerId: string,
  paymentMethodId: string,
  priceId: string
) {
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });

  // Create subscription
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent']
  });
}
```

### Cancel Subscription
```typescript
async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });
}
```

## Webhook Handling

### Webhook Configuration
```typescript
// middleware/stripeWebhookVerification.ts
const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await processStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
```

### Event Processing
```typescript
async function processStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
  }
}
```

## Error Handling

### Payment Errors
```typescript
try {
  await processPayment();
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Handle card error
  } else if (error.type === 'StripeInvalidRequestError') {
    // Handle invalid request
  } else {
    // Handle other errors
  }
}
```

### Webhook Errors
```typescript
if (error.type === 'StripeSignatureVerificationError') {
  // Handle invalid signature
} else if (error.type === 'StripeWebhookError') {
  // Handle webhook processing error
}
```

## Testing

### Test Cards
```typescript
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  expired: '4000000000000069'
};
```

### Webhook Testing
```bash
# Using Stripe CLI
stripe listen --forward-to localhost:5000/api/webhook
```

## Security Best Practices

### PCI Compliance
- Never log full card details
- Use Stripe Elements for secure card collection
- Maintain PCI compliance requirements

### API Key Security
- Use restricted API keys
- Rotate keys periodically
- Monitor API key usage

## Monitoring

### Payment Monitoring
- Track successful payments
- Monitor failed payments
- Track subscription lifecycle
- Monitor webhook delivery

### Error Tracking
- Log payment failures
- Track webhook errors
- Monitor API errors
