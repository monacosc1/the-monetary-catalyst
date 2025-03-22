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
// src/controllers/paymentController.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});
```

## Customer Management

### Customer Creation
```typescript
// src/controllers/paymentController.ts
async function createCustomer(userId: string, email: string) {
  const { data: userProfile } = await supabase
    .from(TABLES.USER_PROFILES)
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (userProfile?.stripe_customer_id) {
    return userProfile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId }
  });

  await supabase
    .from(TABLES.USER_PROFILES)
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', userId);

  return customer.id;
}
```

## Payment Processing

### Checkout Session
```typescript
// src/controllers/paymentController.ts
export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { priceId } = req.body;

  const customerId = await createCustomer(userId, req.user?.email);
  
  const baseUrl = getBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing`,
    client_reference_id: userId,
    metadata: { userId, environment: process.env.NODE_ENV || 'development' }
  });

  res.json({ url: session.url });
};
```

### Setup Intent (for changing payment methods)
```typescript
// src/controllers/paymentController.ts
export const createSetupIntent = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { data: userProfile } = await supabase
    .from(TABLES.USER_PROFILES)
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  const setupIntent = await stripe.setupIntents.create({
    customer: userProfile.stripe_customer_id,
    payment_method_types: ['card'],
    metadata: { userId }
  });

  res.json({ clientSecret: setupIntent.client_secret });
};
```

## Subscription Management

### Cancel Subscription
```typescript
// src/controllers/paymentController.ts
export const cancelSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { data: userProfile } = await supabase
    .from(TABLES.USER_PROFILES)
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: userProfile.stripe_customer_id,
    status: 'active',
    limit: 1
  });

  const stripeSubscription = stripeSubscriptions.data[0];

  const { data: existingSubscription } = await supabase
    .from(TABLES.SUBSCRIPTIONS)
    .select('*')
    .eq('stripe_subscription_id', stripeSubscription.id)
    .single();

  await stripe.subscriptions.update(existingSubscription.stripe_subscription_id, {
    cancel_at_period_end: true
  });

  await supabase
    .from(TABLES.SUBSCRIPTIONS)
    .update({
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', existingSubscription.stripe_subscription_id);

  res.json({ success: true });
};
```

## Webhook Handling

### Webhook Configuration
```typescript
// src/controllers/paymentController.ts
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  let asyncProcessing: Promise<void> | undefined;
  try {
    const sig = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    
    res.json({ received: true });
    
    asyncProcessing = (async () => {
      switch (event.type) {
        case 'checkout.session.completed':
          await processCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.deleted':
          await processSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'setup_intent.succeeded':
          await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }
    })();
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  (req as any).asyncProcessing = asyncProcessing;
};
```

## Error Handling

### Payment Errors
```typescript
try {
  await createCheckoutSession();
} catch (error) {
  console.error('Error creating checkout session:', error);
  res.status(500).json({
    error: 'Failed to create checkout session',
    details: process.env.NODE_ENV !== 'production' ? error.message : undefined
  });
}
```

### Webhook Errors
```typescript
if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
  res.status(400).send(`Webhook Error: Invalid signature`);
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
