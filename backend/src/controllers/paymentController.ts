import { Request, Response } from 'express';
import Stripe from 'stripe';
import supabase from '../config/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { priceId, userId } = req.body;
    
    // Validate price ID
    if (priceId !== process.env.STRIPE_MONTHLY_PRICE_ID && 
        priceId !== process.env.STRIPE_ANNUAL_PRICE_ID) {
      res.status(400).json({ error: 'Invalid price ID' });
      return;
    }

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError || !userProfile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Create or retrieve Stripe customer
    let customerId = userProfile.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          userId: userId
        }
      });
      customerId = customer.id;

      // Update user profile with Stripe customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        userId,
        priceId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature']!;

  try {
    console.log('Received webhook request');
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Webhook event type:', event.type);

    // Log webhook event
    await supabase
      .from('stripe_webhook_logs')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event
      });

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Processing checkout.session.completed');
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        console.log('Checkout session completed processing');
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error details:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Starting handleCheckoutSessionCompleted');
  const userId = session.metadata?.userId;
  console.log('Session details:', {
    id: session.id,
    payment_intent: session.payment_intent,
    subscription: session.subscription,
    customer: session.customer
  });
  
  if (!userId) {
    console.log('No userId in metadata, aborting');
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    console.log('Retrieved subscription:', subscription);

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

    // Update existing subscription
    await supabase
      .from('subscriptions')
      .update({
        payment_status: 'active',
        end_date: new Date(subscription.current_period_end * 1000)
      })
      .eq('stripe_subscription_id', subscription.id);

    // Create payment record with correct Supabase subscription ID
    await supabase
      .from('payments')
      .insert({
        user_id: userId,
        subscription_id: supabaseSubscription.id,  // Fixed: Using Supabase subscription ID
        amount: invoice.amount_paid / 100,
        date: new Date(),
        status: 'successful',
        stripe_payment_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        stripe_payment_status: 'succeeded'
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
