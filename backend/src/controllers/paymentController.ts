import { Request, Response } from 'express';
import Stripe from 'stripe';
import supabase from '../config/supabase';
import { emailService } from '../services/emailService';
import { paymentService } from '../services/paymentService';
import { TABLES } from '../config/tables';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

function isValidCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer): customer is Stripe.Customer {
  return !('deleted' in customer);
}

const getBaseUrl = (): string => {
  const env = process.env.NODE_ENV;
  const frontendUrl = process.env.FRONTEND_URL;

  if (env === 'production') {
    if (!frontendUrl) {
      console.warn('FRONTEND_URL not set in production environment');
      return 'https://themonetarycatalyst.com';
    }
    return frontendUrl;
  }

  if (!frontendUrl) {
    console.warn('FRONTEND_URL not set in development environment, using default');
    return 'http://localhost:3000';
  }

  try {
    new URL(frontendUrl);
    return frontendUrl;
  } catch (error) {
    console.warn(`Invalid FRONTEND_URL format: ${frontendUrl}, using default`);
    return 'http://localhost:3000';
  }
};

interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: string;
  payment_status: string;
  last_payment_id?: string;
  last_payment_date?: string;
  end_date: string;
  updated_at: string;
}

// Load p-retry dynamically once and reuse
let pRetry: typeof import('p-retry')['default'] | undefined;
async function loadPRetry() {
  if (!pRetry) {
    pRetry = (await import('p-retry')).default;
  }
  return pRetry;
}

async function withRetry<T>(operation: () => Promise<T> | PromiseLike<T>): Promise<T> {
  const retry = await loadPRetry();
  return retry(operation, {
    retries: 3,
    minTimeout: 1000,
    factor: 2,
    onFailedAttempt: (error) => {
      console.error(`Retry failed: ${error.message}. Attempts remaining: ${error.retriesLeft}`);
    },
  });
}

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { priceId } = req.body;
    if (!priceId) {
      res.status(400).json({ error: 'priceId is required' });
      return;
    }

    let customerId: string;
    const { data: userProfile } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (userProfile?.stripe_customer_id) {
      customerId = userProfile.stripe_customer_id;
    } else {
      console.log('Calling stripe.customers.create with:', {
        email: req.user?.email,
        metadata: { userId }
      });
      const customer = await stripe.customers.create({
        email: req.user?.email,
        metadata: { userId }
      });
      console.log('Customer created:', customer);
      customerId = customer.id;

      await supabase
        .from(TABLES.USER_PROFILES)
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    const baseUrl = getBaseUrl();
    if (process.env.NODE_ENV !== 'production') {
      console.log('Creating checkout session with:', {
        customerId,
        userId,
        baseUrl,
        priceId
      });
    }

    console.log('Calling stripe.checkout.sessions.create with:', {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      client_reference_id: userId,
      metadata: { userId, environment: process.env.NODE_ENV || 'development' }
    });

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

    if (process.env.NODE_ENV !== 'production') {
      console.log('Checkout session created:', {
        sessionId: session.id,
        successUrl: session.success_url,
        cancelUrl: session.cancel_url
      });
    }
    console.log('Checkout session result:', session);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      userId: req.user?.id,
      priceId: req.body.priceId,
      environment: process.env.NODE_ENV
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined
    });
  }
};


export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    console.log('Received webhook request');
    console.log('Stripe signature:', sig);
    
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    console.log('Webhook event type:', event.type);
    console.log('Webhook event data:', JSON.stringify(event.data.object, null, 2));

    switch (event.type) {
      case 'checkout.session.completed':
        try {
          const session = event.data.object as Stripe.Checkout.Session;
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          const { data: subData, error: insertError } = await supabase
            .from(TABLES.SUBSCRIPTIONS)
            .insert({
              user_id: session.client_reference_id,
              stripe_subscription_id: session.subscription,
              status: 'active',
              plan_type: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly',
              subscription_type: 'professional',
              start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              payment_status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_payment_date: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting subscription:', insertError);
            throw new Error('Failed to create subscription record');
          }

          const invoice = await stripe.invoices.retrieve(session.invoice as string);
          console.log('Detailed payment data:', {
            sessionPaymentIntent: session.payment_intent,
            invoicePaymentIntent: invoice.payment_intent,
            sessionId: session.id,
            invoiceId: invoice.id,
            sessionObject: {
              payment_status: session.payment_status,
              status: session.status,
              mode: session.mode
            }
          });
          
          if (!session.client_reference_id) {
            throw new Error('Missing client_reference_id in session');
          }

          const paymentIntentId = invoice.payment_intent as string;
          if (!paymentIntentId) {
            console.error('No payment intent found in invoice:', invoice.id);
          }

          await paymentService.createPaymentRecord({
            userId: session.client_reference_id,
            subscriptionId: subData.id,
            invoice,
            paymentIntent: paymentIntentId
          });

          console.log('Payment record created with payment intent:', paymentIntentId);
          res.json({ received: true });

          try {
            const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
            if (!isValidCustomer(customer)) {
              console.error('Customer has been deleted');
              return;
            }

            const firstName = customer.metadata?.first_name || 
                             (customer.name ? customer.name.split(' ')[0] : null);

            await emailService.sendSubscriptionConfirmation(
              customer.email || '',
              firstName,
              subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly',
              'professional'
            );
            console.log('Subscription confirmation email sent successfully');
          } catch (emailError) {
            console.error('Email error:', emailError);
          }
        } catch (error) {
          console.error('Error processing checkout.session.completed:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process subscription' });
          }
        }
        break;

        case 'customer.subscription.deleted':
          try {
            const subscription = event.data.object as Stripe.Subscription;
            console.log('Received subscription.deleted webhook:', {
              subscriptionId: subscription.id,
              customerId: subscription.customer,
              endDate: new Date(subscription.current_period_end * 1000)
            });
            
            const { error: updateError } = await supabase
              .from(TABLES.SUBSCRIPTIONS)
              .update({
                status: 'expired',
                payment_status: 'cancelled',
                updated_at: new Date().toISOString(),
                end_date: new Date(subscription.current_period_end * 1000).toISOString()
              })
              .eq('stripe_subscription_id', subscription.id);
  
            if (updateError) {
              console.error('Error updating subscription status:', updateError);
              throw new Error('Failed to update subscription status');
            }
  
            console.log('Successfully marked subscription as expired:', subscription.id);
            res.json({ received: true }); // Added
          } catch (error) {
            console.error('Error processing subscription.deleted webhook:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to process subscription deletion' });
            }
          }
          break;
  
        case 'invoice.payment_succeeded':
          try {
            await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
            if (!res.headersSent) {
              res.json({ received: true }); // Added
            }
          } catch (error) {
            console.error('Error processing invoice.payment_succeeded:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to process invoice payment' });
            }
          }
          break;
  
        case 'invoice.payment_failed':
          try {
            await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
            if (!res.headersSent) {
              res.json({ received: true }); // Added
            }
          } catch (error) {
            console.error('Error processing invoice.payment_failed:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to process invoice payment failure' });
            }
          }
          break;
      }
    } catch (err) {
      if (!res.headersSent) {
        res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  };

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const userId = subscription.metadata.userId;

    const response = await withRetry(async () => {
      const result = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .select('id, user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      return result;
    });

    const { data: supabaseSubscription, error: fetchError } = response;

    if (fetchError || !supabaseSubscription) {
      console.error('No matching Supabase subscription found:', fetchError);
      return;
    }

    await paymentService.createPaymentRecord({
      userId,
      subscriptionId: supabaseSubscription.id,
      invoice,
      paymentIntent: invoice.payment_intent as string
    });

    await withRetry(async () => {
      const result = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .update({
          status: 'active',
          payment_status: 'active',
          last_payment_id: invoice.payment_intent as string,
          last_payment_date: new Date().toISOString(),
          end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', supabaseSubscription.id);
      return result;
    });

    console.log('Successfully processed recurring payment for subscription:', subscription.id);
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  try {
    await withRetry(async () => {
      const result = await supabase
        .from(TABLES.SUBSCRIPTIONS)
        .update({
          payment_status: 'failed',
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', invoice.subscription);
      return result;
    });

    console.log('Payment failure processed for subscription:', invoice.subscription);
  } catch (error) {
    console.error('Error in handleInvoicePaymentFailed:', error);
    throw error;
  }
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  try {
    if (!setupIntent.payment_method || !setupIntent.customer) {
      console.error('Missing payment method or customer');
      return;
    }

    await stripe.customers.update(setupIntent.customer as string, {
      invoice_settings: {
        default_payment_method: setupIntent.payment_method as string
      }
    });

    const subscriptions = await stripe.subscriptions.list({
      customer: setupIntent.customer as string,
      status: 'active'
    });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: setupIntent.payment_method as string
      });
    }

    console.log('Updated default payment method for customer and subscriptions:', {
      customerId: setupIntent.customer,
      paymentMethodId: setupIntent.payment_method
    });
  } catch (error) {
    console.error('Error handling setup intent succeeded:', error);
  }
}

export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id } = req.query;
    console.log('Verifying session:', session_id);

    if (!session_id || typeof session_id !== 'string') {
      console.log('Invalid session ID:', session_id);
      res.status(400).json({ success: false, error: 'Invalid session ID' });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('Retrieved session:', {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerId: session.customer,
      subscriptionId: session.subscription
    });
    
    const { data: subscription, error: subError } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .select('*')
      .eq('stripe_subscription_id', session.subscription)
      .single();
    
    console.log('Supabase subscription check:', { subscription, error: subError });

    if (session.payment_status === 'paid' && session.status === 'complete') {
      res.json({ 
        success: true,
        status: session.status,
        paymentStatus: session.payment_status,
        subscription: subscription
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Payment incomplete',
        status: session.status,
        paymentStatus: session.payment_status
      });
    }
  } catch (error) {
    console.error('Session verification error details:', error);
    res.status(500).json({ success: false, error: 'Failed to verify session' });
  }
};

export const getPaymentMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: userProfile } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      res.status(404).json({ error: 'No payment method found' });
      return;
    }

    const customerResponse = await stripe.customers.retrieve(userProfile.stripe_customer_id, {
      expand: ['invoice_settings.default_payment_method']
    });

    if (!isValidCustomer(customerResponse)) {
      res.status(404).json({ error: 'Customer not found or deleted' });
      return;
    }

    let paymentMethod: Stripe.PaymentMethod | null = null;

    if (customerResponse.invoice_settings?.default_payment_method) {
      paymentMethod = customerResponse.invoice_settings.default_payment_method as Stripe.PaymentMethod;
    } else {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userProfile.stripe_customer_id,
        type: 'card'
      });
      paymentMethod = paymentMethods.data[0] || null;
    }

    if (!paymentMethod?.card) {
      res.json({ card: null });
      return;
    }

    res.json({
      card: {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year
      }
    });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ error: 'Failed to fetch payment method' });
  }
};

export const createSetupIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { data: userProfile } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: userProfile.stripe_customer_id,
      payment_method_types: ['card'],
      metadata: { userId }
    });

    if (!setupIntent.client_secret) {
      throw new Error('Failed to create setup intent');
    }

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
};

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('Attempting to cancel subscription for userId:', userId);

    const { data: userProfile } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      res.status(404).json({ error: 'No customer profile found' });
      return;
    }

    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: userProfile.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (stripeSubscriptions.data.length === 0) {
      res.status(404).json({ error: 'No active subscription found in Stripe' });
      return;
    }

    const stripeSubscription = stripeSubscriptions.data[0];

    const { data: existingSubscription, error: fetchError } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .select('*')
      .eq('stripe_subscription_id', stripeSubscription.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError);
      res.status(500).json({ error: 'Failed to fetch subscription data' });
      return;
    }

    if (!existingSubscription) {
      console.error('No subscription found in database for stripe_subscription_id:', stripeSubscription.id);
      res.status(404).json({ error: 'No subscription found in database' });
      return;
    }

    console.log('Cancelling Stripe subscription:', existingSubscription.stripe_subscription_id);

    await stripe.subscriptions.update(existingSubscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    const { error: updateError } = await supabase
      .from(TABLES.SUBSCRIPTIONS)
      .update({
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', existingSubscription.stripe_subscription_id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      res.status(500).json({ error: 'Failed to update subscription status' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};