import { Request, Response } from 'express';
import Stripe from 'stripe';
import supabase from '../config/supabase';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get or create customer
    let customerId: string;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (userProfile?.stripe_customer_id) {
      customerId = userProfile.stripe_customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: req.user?.email,
        metadata: {
          userId: userId
        }
      });
      customerId = customer.id;

      // Save customer ID to user_profiles
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: req.body.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      client_reference_id: userId,
      metadata: {
        userId: userId
      }
    });

    res.json({ url: session.url }); // Return the URL instead of sessionId
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event;

  try {
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
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout session:', session.id);

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('Retrieved subscription details:', subscription);
        
        // Create subscription record in Supabase
        const { data: subData, error: insertError } = await supabase
          .from('subscriptions')
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

        console.log('Supabase subscription insert result:', { data: subData, error: insertError });

        if (insertError) {
          console.error('Error inserting subscription:', insertError);
          throw new Error('Failed to create subscription record');
        }

        // Add more detailed logging for payment creation
        console.log('Session invoice details:', {
          invoice: session.invoice,
          payment_intent: session.payment_intent,
          amount_total: session.amount_total
        });

        try {
          // Get the invoice for this session
          if (!session.invoice) {
            throw new Error('No invoice found in session');
          }

          const invoice = await stripe.invoices.retrieve(session.invoice as string);
          console.log('Retrieved invoice details:', {
            id: invoice.id,
            payment_intent: invoice.payment_intent,
            amount_paid: invoice.amount_paid,
            status: invoice.status
          });

          // Create payment record with additional error handling
          const paymentData = {
            user_id: session.client_reference_id,
            subscription_id: subData.id,
            amount: invoice.amount_paid / 100,
            date: new Date().toISOString(),
            status: 'successful',
            stripe_payment_id: invoice.payment_intent as string,
            stripe_invoice_id: invoice.id,
            stripe_payment_status: 'succeeded',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log('Attempting to insert payment record:', paymentData);

          const { data: payData, error: paymentError } = await supabase
            .from('payments')
            .insert(paymentData)
            .select()
            .single();

          console.log('Supabase payment insert result:', { data: payData, error: paymentError });

          if (paymentError) {
            console.error('Error inserting payment:', paymentError);
            console.error('Payment insert error details:', {
              code: paymentError.code,
              message: paymentError.message,
              details: paymentError.details
            });
            // Don't throw here, but log the error
          }

          // Update subscription with last_payment_id only if payment was created
          if (payData) {
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                last_payment_id: payData.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', subData.id);

            if (updateError) {
              console.error('Error updating subscription with payment ID:', updateError);
            }
          }
        } catch (error) {
          console.error('Error processing payment record:', error);
          // Log error but don't throw to ensure webhook completes
        }

        break;

      // Handle other webhook events as needed
      case 'customer.subscription.updated':
        // Handle subscription updates
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellations
        break;
    }

    res.json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Starting handleCheckoutSessionCompleted');
  const userId = session.metadata?.userId;
  
  if (!userId) {
    console.log('No userId in metadata, aborting');
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    console.log('Retrieved subscription:', subscription);

    // Get the payment method ID from the session
    let paymentMethodId: string | null = null;

    if (typeof session.setup_intent === 'string') {
      const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
      paymentMethodId = setupIntent.payment_method as string;
    } else if (typeof session.payment_intent === 'string') {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      paymentMethodId = paymentIntent.payment_method as string;
    }

    // If we have a payment method, set it as default
    if (paymentMethodId) {
      await stripe.customers.update(session.customer as string, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Also attach it to the subscription
      await stripe.subscriptions.update(subscription.id, {
        default_payment_method: paymentMethodId
      });

      console.log('Set default payment method:', paymentMethodId);
    }

    // Get the latest invoice for this subscription
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
    console.log('Retrieved invoice:', {
      id: invoice.id,
      payment_intent: invoice.payment_intent,
      amount_paid: invoice.amount_paid
    });

    // Check for existing active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    let subscriptionData;

    if (existingSubscription) {
      // Update existing if same plan type
      if (existingSubscription.plan_type === (subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly')) {
        const { data, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            end_date: new Date(subscription.current_period_end * 1000),
            payment_status: 'active'
          })
          .eq('id', existingSubscription.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return;
        }
        subscriptionData = data;
      } else {
        // If plan type changed, mark old as expired and create new
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            payment_status: 'cancelled',
            end_date: new Date()
          })
          .eq('id', existingSubscription.id);

        const { data, error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            plan_type: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly',
            status: 'active',
            payment_status: 'active',
            start_date: new Date(subscription.current_period_start * 1000),
            end_date: new Date(subscription.current_period_end * 1000),
            subscription_type: 'professional'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating new subscription:', error);
          return;
        }
        subscriptionData = data;
      }
    } else {
      // No active subscription exists, create new one
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          plan_type: subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly',
          status: 'active',
          payment_status: 'active',
          start_date: new Date(subscription.current_period_start * 1000),
          end_date: new Date(subscription.current_period_end * 1000),
          subscription_type: 'professional'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return;
      }
      subscriptionData = data;
    }

    // Create payment record using invoice data instead of payment intent
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        subscription_id: subscriptionData.id,
        amount: invoice.amount_paid / 100,
        date: new Date(),
        status: 'successful',
        stripe_payment_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        stripe_payment_status: 'succeeded'
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
    }
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    // Log the full error object for debugging
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const userId = subscription.metadata.userId;

    // Get the Supabase subscription ID
    const { data: supabaseSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!supabaseSubscription) {
      console.error('No matching Supabase subscription found');
      return;
    }

    // Create payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        subscription_id: supabaseSubscription.id,
        amount: invoice.amount_paid / 100,
        date: new Date(),
        status: 'successful',
        stripe_payment_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        stripe_payment_status: 'succeeded'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return;
    }

    // Only update fields not handled by the trigger
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        payment_status: 'active',
        end_date: new Date(subscription.current_period_end * 1000)
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    }

    console.log('Successfully processed recurring payment:', {
      paymentId: paymentData.id,
      subscriptionId: supabaseSubscription.id,
      newEndDate: new Date(subscription.current_period_end * 1000)
    });

  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  await supabase
    .from('subscriptions')
    .update({
      payment_status: 'failed',
      status: 'inactive'
    })
    .eq('stripe_subscription_id', invoice.subscription);
}

async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  try {
    if (!setupIntent.payment_method || !setupIntent.customer) {
      console.error('Missing payment method or customer');
      return;
    }

    // Set as default payment method for the customer
    await stripe.customers.update(setupIntent.customer as string, {
      invoice_settings: {
        default_payment_method: setupIntent.payment_method as string
      }
    });

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: setupIntent.customer as string,
      status: 'active'
    });

    // Update default payment method for all active subscriptions
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
    
    // Check Supabase tables
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
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

    // Get user's Stripe customer ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      res.status(404).json({ error: 'No payment method found' });
      return;
    }

    // Get customer's payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: userProfile.stripe_customer_id,
      type: 'card'
    });

    const defaultPaymentMethod = paymentMethods.data[0];
    if (!defaultPaymentMethod) {
      res.json({ card: null });
      return;
    }

    res.json({
      card: {
        last4: defaultPaymentMethod.card?.last4,
        brand: defaultPaymentMethod.card?.brand,
        exp_month: defaultPaymentMethod.card?.exp_month,
        exp_year: defaultPaymentMethod.card?.exp_year
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

    // Get user's Stripe customer ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: userProfile.stripe_customer_id,
      payment_method_types: ['card'],
      // Add metadata to identify the customer
      metadata: {
        userId: userId
      }
    });

    // Add a webhook handler for setup_intent.succeeded
    if (!setupIntent.client_secret) {
      throw new Error('Failed to create setup intent');
    }

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
};

export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }

    // Cancel in Stripe at period end
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

