import { Stripe } from 'stripe';
import supabase from '../config/supabase';

interface CreatePaymentParams {
  userId: string | null;
  subscriptionId: string;
  invoice: Stripe.Invoice;
  paymentIntent: string;
}

export class PaymentService {
  async createPaymentRecord({
    userId,
    subscriptionId,
    invoice,
    paymentIntent
  }: CreatePaymentParams) {
    if (!userId) {
      throw new Error('userId is required for payment record creation');
    }

    console.log('Creating payment record:', {
      userId,
      subscriptionId,
      invoiceId: invoice.id,
      paymentIntent
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        amount: invoice.amount_paid / 100,
        date: new Date().toISOString(),
        status: 'successful',
        stripe_payment_id: paymentIntent,
        stripe_invoice_id: invoice.id,
        stripe_payment_status: 'succeeded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    console.log('Payment record created successfully:', payment);
    return payment;
  }
}

export const paymentService = new PaymentService();
