import { Request, Response } from 'express';
import supabase from '../config/supabase';
import { emailService } from '../services/emailService';
import { NewsletterSubscription } from '../types/newsletter';

export const subscribeToNewsletter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, source }: NewsletterSubscription = req.body;

    // Validate inputs
    if (!email || !name || !source) {
      res.status(400).json({
        success: false,
        message: 'Email, name, and source are required'
      });
      return;
    }

    // Validate email format
    const isValidEmail = await emailService.validateEmail(email);
    if (!isValidEmail) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
      return;
    }

    // Check if email already exists in newsletter_users
    const { data: existingSubscriber } = await supabase
      .from('newsletter_users')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existingSubscriber) {
      if (existingSubscriber.status === 'active') {
        res.status(400).json({
          success: false,
          message: 'This email is already subscribed to our newsletter'
        });
        return;
      } else {
        // If they exist but status is 'unsubscribed', reactivate them
        const { data, error } = await supabase
          .from('newsletter_users')
          .update({
            status: 'active',
            name,
            source,
            updated_at: new Date().toISOString(),
            unsubscribed_at: null
          })
          .eq('email', email)
          .select()
          .single();

        if (error) throw error;

        // Send welcome back email
        await emailService.sendNewsletterWelcomeBackEmail(email, name);

        res.status(200).json({
          success: true,
          message: 'Welcome back! Your newsletter subscription has been reactivated',
          data
        });
        return;
      }
    }

    // Create new subscriber
    const { data, error } = await supabase
      .from('newsletter_users')
      .insert({
        email,
        name,
        source,
        status: 'active',
        subscribed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Send welcome email
    await emailService.sendNewsletterWelcomeEmail(email, name);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process newsletter subscription'
    });
  }
}; 