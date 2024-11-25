// src/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import { RequestHandler } from 'express';
import express from 'express';
import { emailService } from '../services/emailService';
import supabase from '../config/supabase';

// Create a router instance
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

// Add this temporary test endpoint
router.get('/test-welcome-email', async (req, res) => {
  try {
    await emailService.sendWelcomeEmail(
      'your.test@email.com',
      'Test User'
    );
    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Add this new route to handle Google OAuth callback
router.post('/google-callback', async (req, res) => {
  try {
    const { user_id, email, first_name, last_name, google_id, raw_user_metadata } = req.body;

    console.log('Received Google user data:', {
      user_id,
      email,
      first_name,
      last_name,
      raw_user_metadata
    });

    // Check if user profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select()
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const displayName = first_name || 'there'; // Fallback for welcome email if no name available

    if (!existingProfile) {
      // Create new user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id,
          email,
          first_name: first_name || null, // Store as NULL if not available
          last_name: last_name || null,   // Store as NULL if not available
          role: 'user',
          google_id,
          terms_accepted: true
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Send welcome email with appropriate name handling
      try {
        await emailService.sendWelcomeEmail(
          email,
          displayName // Use first name if available, otherwise "there"
        );
        console.log('Welcome email sent successfully to Google user');
      } catch (emailError) {
        console.error('Failed to send welcome email to Google user:', emailError);
      }

      res.json({ success: true, profile: profileData });
    } else {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          email,
          first_name: first_name || existingProfile.first_name, // Keep existing if new is null
          last_name: last_name || existingProfile.last_name,    // Keep existing if new is null
          google_id
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
          google_id 
        } 
      });
    }
  } catch (error) {
    console.error('Error in Google callback processing:', error);
    res.status(500).json({ error: 'Failed to process Google callback' });
  }
});

export default router;
