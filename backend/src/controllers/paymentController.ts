import { Request, Response } from 'express';
import Stripe from 'stripe';
import supabase from '../config/supabase';
import { emailService } from '../services/emailService';
import { paymentService } from '../services/paymentService';

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

          if (insertError) {
            console.error('Error inserting subscription:', insertError);
            throw new Error('Failed to create subscription record');
          }

          // Get the invoice for this session
          const invoice = await stripe.invoices.retrieve(session.invoice as string);
          console.log('Detailed payment data:', {
            sessionPaymentIntent: session.payment_intent,
            invoicePaymentIntent: invoice.payment_intent,
            sessionId: session.id,
            invoiceId: invoice.id,
            // Add more fields to help debug
            sessionObject: {
              payment_status: session.payment_status,
              status: session.status,
              mode: session.mode
            }
          });
          
          // Create payment record using the new service
          try {
            if (!session.client_reference_id) {
              throw new Error('Missing client_reference_id in session');
            }

            // Get the actual payment intent ID from the invoice
            const paymentIntentId = invoice.payment_intent as string;
            
            if (!paymentIntentId) {
              console.error('No payment intent found in invoice:', invoice.id);
            }

            await paymentService.createPaymentRecord({
              userId: session.client_reference_id,
              subscriptionId: subData.id,
              invoice,
              paymentIntent: paymentIntentId // Using invoice.payment_intent instead of session.payment_intent
            });

            console.log('Payment record created with payment intent:', paymentIntentId);
          } catch (paymentError) {
            console.error('Payment record creation failed:', paymentError);
          }

          // Send response immediately
          res.json({ received: true });

          // Handle email after response (fire and forget)
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
              firstName,  // Pass the extracted firstName instead of customer.name
              subscription.items.data[0].price.recurring?.interval === 'month' ? 'monthly' : 'yearly',
              'professional'
            );
            console.log('Subscription confirmation email sent successfully');
          } catch (emailError) {
            console.error('Email error:', emailError);
          }
        } catch (error) {
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
          
          // Update subscription status in Supabase
          const { error: updateError } = await supabase
            .from('subscriptions')
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
        } catch (error) {
          console.error('Error processing subscription.deleted webhook:', error);
        }
        break;

      case 'invoice.payment_succeeded':
        try {
          const invoice = event.data.object as Stripe.Invoice;
          
          // Only process if this is a subscription invoice
          if (invoice.subscription) {
            console.log('Processing subscription invoice payment:', {
              subscriptionId: invoice.subscription,
              customerId: invoice.customer,
              amount: invoice.amount_paid
            });

            // Get subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            
            // Find the subscription in Supabase
            const { data: supabaseSubscription, error: subError } = await supabase
              .from('subscriptions')
              .select('id, user_id')
              .eq('stripe_subscription_id', invoice.subscription)
              .single();

            if (subError) {
              console.error('Error finding subscription:', subError);
              throw new Error('Failed to find subscription');
            }

            // Create payment record
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                user_id: supabaseSubscription.user_id,
                subscription_id: supabaseSubscription.id,
                amount: invoice.amount_paid,
                date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'successful',
                stripe_payment_id: invoice.payment_intent as string,
                stripe_invoice_id: invoice.id,
                stripe_payment_status: invoice.status
              });

            if (paymentError) {
              console.error('Error creating payment record:', paymentError);
              throw new Error('Failed to create payment record');
            }

            // Update subscription end date
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
                last_payment_date: new Date().toISOString()
              })
              .eq('stripe_subscription_id', invoice.subscription);

            if (updateError) {
              console.error('Error updating subscription:', updateError);
              throw new Error('Failed to update subscription');
            }

            console.log('Successfully processed subscription payment');
          }
        } catch (error) {
          console.error('Error processing invoice.payment_succeeded:', error);
          // Don't throw here - we want to send 200 response to Stripe
        }
        break;
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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
    const { error: paymentError } = await supabase
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
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        payment_status: 'active',
        end_date: new Date(subscription.current_period_end * 1000),
        updated_at: new Date().toISOString(),
        last_payment_date: new Date().toISOString()
      })
      .eq('id', supabaseSubscription.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    }

  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error);
    throw error;
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

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('Attempting to cancel subscription for userId:', userId);

    // Get active subscription from Supabase - modify the query to find by stripe_subscription_id
    let activeSubscription;
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!userProfile?.stripe_customer_id) {
      res.status(404).json({ error: 'No customer profile found' });
      return;
    }

    // Get subscription from Stripe first
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

    // Try to find existing subscription in Supabase by stripe_subscription_id
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('subscriptions')
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

    activeSubscription = existingSubscription;

    console.log('Cancelling Stripe subscription:', activeSubscription.stripe_subscription_id);

    // Cancel in Stripe at period end
    await stripe.subscriptions.update(activeSubscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', activeSubscription.stripe_subscription_id);

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

