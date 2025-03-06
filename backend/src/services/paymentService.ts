// src/services/paymentService.ts
import supabase from '../config/supabase'; // Updated to default import
import { TABLES } from '../config/tables';

// Note: If future methods need to interact with Stripe (e.g., to fetch invoice details),
// you may need to add: import { Stripe } from 'stripe';

export class PaymentService {
  static async createPaymentRecord(userId: string, subscriptionId: string, invoiceId: string | null, paymentIntent: string, amount: number) {
    console.log('Creating payment record:', { userId, subscriptionId, invoiceId, paymentIntent });

    const paymentData = {
      user_id: userId,
      subscription_id: subscriptionId,
      amount: amount, // Assuming a fixed amount for testing; adjust as needed
      date: new Date().toISOString(),
      status: 'successful',
      stripe_payment_id: paymentIntent,
      stripe_invoice_id: invoiceId,
      stripe_payment_status: 'succeeded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      console.log('Calling supabase.from(TABLES.PAYMENTS).insert:', paymentData);
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .insert([paymentData]);

      if (error) throw new Error(`Failed to create payment record: ${error.message}`);

      // Only call select if the insert was successful
      console.log('Calling supabase.from(TABLES.PAYMENTS).select for stripe_payment_id:', paymentIntent);
      const { data: insertedData, error: selectError } = await supabase
        .from(TABLES.PAYMENTS)
        .select()
        .eq('stripe_payment_id', paymentIntent)
        .single();

      if (selectError) throw new Error(`Failed to retrieve payment record: ${selectError.message}`);

      console.log('Payment record created successfully:', insertedData);
      return insertedData;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }
}