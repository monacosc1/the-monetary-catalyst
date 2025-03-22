// /backend/src/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import { RequestHandler } from 'express';
import { emailService } from '../services/emailService';
import supabase from '../config/supabase';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const router = Router();

// Route for user registration
router.post('/register', registerUser as RequestHandler);

// Route for user login
router.post('/login', loginUser as RequestHandler);

// Route to get user profile (protected)
router.get('/profile', authMiddleware, getUserProfile as RequestHandler);

router.post('/welcome-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    await emailService.sendWelcomeEmail(email, name);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// Test endpoint
router.get('/test-welcome-email', async (req, res) => {
  try {
    await emailService.sendWelcomeEmail('your.test@email.com', 'Test User');
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Google OAuth callback
router.post('/google-callback', async (req, res) => {
  try {
    const { user_id, email, first_name, last_name, google_id, raw_user_metadata } = req.body;

    console.log('Received Google user data:', {
      user_id,
      email,
      first_name,
      last_name,
      google_id,
      raw_user_metadata,
    });

    // Validate required fields
    if (!user_id || !email) {
      throw new Error('Missing required user data');
    }

    // Check if user profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select()
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const displayName = first_name || 'there';

    if (!existingProfile) {
      // Create new user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id,
          email,
          first_name: first_name || null,
          last_name: last_name || null,
          role: 'user',
          google_id,
          terms_accepted: true,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        // Rollback auth user creation
        await supabase.auth.admin.deleteUser(user_id);
        throw profileError;
      }

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(email, displayName);
        console.log('Welcome email sent successfully to Google user');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      res.json({ success: true, profile: profileData });
    } else {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          email,
          first_name: first_name || existingProfile.first_name,
          last_name: last_name || existingProfile.last_name,
          google_id,
        })
        .eq('user_id', user_id);

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        profile: {
          ...existingProfile,
          email,
          first_name: first_name || existingProfile.first_name,
          last_name: last_name || existingProfile.last_name,
          google_id,
        },
      });
    }
  } catch (error) {
    console.error('Error in Google callback processing:', error);
    res.status(500).json({ error: 'Failed to process Google callback' });
  }
});

// Password reset handler
const handleResetPassword: RequestHandler = async (req, res) => {
  const { email, redirectTo } = req.body;
  try {
    console.log('Starting password reset process for:', email);
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (userError) {
      console.log('User not found:', email);
      res.json({ success: true }); // Prevent email enumeration
      return;
    }

    const { data, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (tokenError || !data?.properties?.action_link) {
      console.error('Error generating recovery token:', tokenError);
      throw tokenError || new Error('Failed to generate recovery link');
    }

    await emailService.sendPasswordResetEmail(email, data.properties.action_link);
    console.log('Password reset email sent successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    res.status(500).json({
      error: 'Failed to send reset password email',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// SMTP test handler
const handleTestSMTP: RequestHandler = async (req, res) => {
  try {
    await emailService.testSMTP();
    res.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
};

router.post('/reset-password', handleResetPassword);
router.post('/test-smtp', handleTestSMTP);

router.post('/test-direct-email', async (req, res) => {
  try {
    const { email } = req.body;
    await emailService.testSMTP();
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Direct email test failed:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/test-sendgrid', async (req, res) => {
  try {
    console.log('Starting SendGrid test...');
    const result = await emailService.testSMTP();
    console.log('SendGrid test completed successfully');
    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: result,
    });
  } catch (error) {
    console.error('SendGrid test failed:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;