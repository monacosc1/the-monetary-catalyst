import { Request, Response } from 'express';
import supabase from '../config/supabase';

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: string;
  category: string[];
  sg_event_id: string;
  sg_message_id: string;
  useragent?: string;
  ip?: string;
  asm_group_id?: number;
}

export const handleSendGridWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const events: SendGridEvent[] = JSON.parse(req.body.toString());

    for (const event of events) {
      // Log all events for debugging
      console.log('Received SendGrid event:', {
        type: event.event,
        email: event.email,
        timestamp: event.timestamp,
        asm_group_id: event.asm_group_id
      });

      switch (event.event) {
        case 'group_unsubscribe':
        case 'unsubscribe':
          if (event.asm_group_id === 26010) { // Newsletter group ID
            // Update newsletter_users table
            const { error: newsletterError } = await supabase
              .from('newsletter_users')
              .update({
                status: 'unsubscribed',
                unsubscribed_at: new Date(event.timestamp * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('email', event.email);

            if (newsletterError) {
              console.error('Error updating newsletter_users status:', newsletterError);
              continue;
            }

            // Update user_profiles table if user exists
            const { error: profileError } = await supabase
              .from('user_profiles')
              .update({
                newsletter_subscribed: false,
                updated_at: new Date().toISOString()
              })
              .eq('email', event.email);

            if (profileError) {
              console.error('Error updating user_profiles newsletter status:', profileError);
              // Don't continue here as the main newsletter_users update was successful
            }

            console.log(`Successfully processed unsubscribe for ${event.email}`);
          }
          break;

        // Handle other event types you're already processing
        case 'bounce':
          // Your existing bounce handling code
          break;
        case 'delivered':
          // Your existing delivery handling code
          break;
        // ... other event types
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}; 