import { Request, Response } from 'express';
import supabase from '../config/supabase';
import { emailService } from '../services/emailService';
import { NewsletterSubscription } from '../types/newsletter';
import { TABLES } from '../config/tables';

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

    // Check existing user profile
    const { data: existingUserProfile, error: profileError } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('user_id, newsletter_subscribed')
      .eq('email', email)
      .single();

    // Handle database errors during profile check
    if (profileError) {
      console.error('Error checking existing user profile:', profileError);
      throw profileError;
    }

    // Check if email already exists in newsletter_users
    const { data: existingSubscriber, error: subscriberError } = await supabase
      .from(TABLES.NEWSLETTER_USERS)
      .select('id, status')
      .eq('email', email)
      .single();

    // Handle database errors during subscriber check
    if (subscriberError && subscriberError.code !== 'PGRST116') { // Ignore "not found" error
      console.error('Error checking existing subscriber:', subscriberError);
      throw subscriberError;
    }

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
          .from(TABLES.NEWSLETTER_USERS)
          .update({
            status: 'active',
            name,
            source,
            updated_at: new Date().toISOString(),
            unsubscribed_at: null,
            user_id: existingUserProfile?.user_id || null // Link to user profile if exists
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

    // Create/update newsletter subscription
    const { data, error } = await supabase
      .from(TABLES.NEWSLETTER_USERS)
      .insert({
        email,
        name,
        source,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        user_id: existingUserProfile?.user_id || null
      })
      .select()
      .single();

    if (error) throw error;

    // Update user profile if exists
    if (existingUserProfile) {
      await supabase
        .from(TABLES.USER_PROFILES)
        .update({
          newsletter_subscribed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', existingUserProfile.user_id);
    }

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