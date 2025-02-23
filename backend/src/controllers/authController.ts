// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { signToken } from '../services/jwtService';
import config from '../config/environment';
import { emailService } from '../services/emailService';
import { TABLES } from '../config/tables';

// Register User
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email, password, first_name, last_name, termsAccepted } = req.body;
    
    console.log('Registration request received:', {
      email,
      first_name,
      last_name,
      termsAccepted
    });

    if (!termsAccepted) {
      res.status(400).json({ message: 'You must accept the Terms & Conditions to create an account.' });
      return;
    }

    // Add email validation
    const isValidEmail = await emailService.validateEmail(email);
    if (!isValidEmail) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name,
        last_name
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      res.status(400).json({ message: authError.message });
      return;
    }

    console.log('Auth user created:', {
      userId: authData.user.id,
      email: authData.user.email
    });

    // Check for existing newsletter subscription
    console.log('Checking for existing newsletter subscription...');
    const { data: newsletterSubscription, error: newsletterError } = await supabase
      .from(TABLES.NEWSLETTER_USERS)
      .select('id, status')
      .eq('email', email)
      .single();

    if (newsletterError) {
      console.warn('Error checking newsletter subscription:', newsletterError);
      // Don't fail registration - continue with newsletter_subscribed false
    }

    const isNewsletterSubscribed = newsletterSubscription?.status === 'active';
    console.log('Newsletter subscription status:', {
      exists: !!newsletterSubscription,
      status: newsletterSubscription?.status,
      isSubscribed: isNewsletterSubscribed
    });

    // Before profile creation attempt
    const { data: existingProfileCheck } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('user_id, email')
      .eq('user_id', authData.user.id)
      .single();

    console.log('Existing profile check:', {
      existingProfile: existingProfileCheck,
      attemptingToCreate: {
        user_id: authData.user.id,
        email,
        first_name,
        last_name,
        newsletter_subscribed: isNewsletterSubscribed
      }
    });

    // Create or update profile with newsletter status
    const profileData = {
      user_id: authData.user.id,
      email,
      first_name,
      last_name,
      role: 'user',
      terms_accepted: termsAccepted,
      newsletter_subscribed: isNewsletterSubscribed
    };

    let profile;
    if (existingProfileCheck) {
      console.log('Updating existing profile with:', profileData);
      const { data: updatedProfile, error: profileError } = await supabase
        .from(TABLES.USER_PROFILES)
        .update(profileData)
        .eq('user_id', authData.user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error:', profileError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        res.status(500).json({ message: 'Error updating user profile' });
        return;
      }
      profile = updatedProfile;
      console.log('Profile updated successfully:', profile);
    } else {
      console.log('Creating new profile with:', profileData);
      const { data: newProfile, error: profileError } = await supabase
        .from(TABLES.USER_PROFILES)
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        res.status(500).json({ message: 'Error creating user profile' });
        return;
      }
      profile = newProfile;
      console.log('Profile created successfully:', profile);
    }

    // Link newsletter subscription if exists
    if (newsletterSubscription) {
      console.log('Linking newsletter subscription to user:', {
        newsletter_id: newsletterSubscription.id,
        user_id: authData.user.id
      });

      const { error: updateError } = await supabase
        .from(TABLES.NEWSLETTER_USERS)
        .update({
          user_id: authData.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('email', email);

      if (updateError) {
        console.error('Error linking newsletter subscription:', updateError);
        // Don't throw - we still want to complete registration
      } else {
        console.log('Newsletter subscription linked successfully');
      }
    }

    // Fire and forget the welcome email
    emailService.sendWelcomeEmail(email, first_name)
      .catch(error => console.error('Welcome email error:', error));

    const responseData = {
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email,
        first_name,
        last_name,
        newsletter_subscribed: isNewsletterSubscribed
      }
    };
    console.log('Sending registration response:', responseData);

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

// Login User
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Add debug log
    console.log('loginUser: About to call signInWithPassword', {
      isMockFunction: jest.isMockFunction(supabase.auth.signInWithPassword)
    });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // Add debug log
    console.log('loginUser: Auth response:', { authData, authError });

    if (authError || !authData.user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Get additional profile data
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      res.status(500).json({ message: 'Error fetching user profile' });
      return;
    }

    // Generate JWT token
    const token = signToken(authData.user.id);

    res.status(200).json({ 
      message: 'User logged in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: profile.first_name,
        last_name: profile.last_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Get User Profile
export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Assuming the user object is attached to the request by the authMiddleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Fetch user profile from the database
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.USER_PROFILES)
      .select()
      .eq('user_id', userId)
      .single();

    if (profileError) {
      res.status(500).json({ message: 'Error fetching user profile', error: profileError.message });
      return;
    }

    if (!profile) {
      res.status(404).json({ message: 'User profile not found' });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};
