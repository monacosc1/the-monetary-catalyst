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
    
    // Add logging
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      res.status(400).json({ message: authError.message });
      return;
    }

    // After auth user creation
    console.log('Auth user created:', {
      userId: authData.user.id,
      email: authData.user.email
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
        last_name
      }
    });

    // After auth user creation and existing profile check...
    if (existingProfileCheck) {
      // Update existing profile instead of trying to insert
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({
          email,
          first_name,
          last_name,
          role: 'user',
          terms_accepted: termsAccepted,
          newsletter_subscribed: false
        })
        .eq('user_id', authData.user.id)
        .select()
        .single();

      // Add logging for profile result
      if (profile) {
        console.log('Profile updated successfully:', profile);
      }
      if (profileError) {
        console.error('Profile update error:', profileError);
        // If profile update fails, clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        res.status(500).json({ message: 'Error updating user profile' });
        return;
      }
    } else {
      // Create new profile if one doesn't exist
      const { data: profile, error: profileError } = await supabase
        .from(TABLES.USER_PROFILES)
        .insert({
          user_id: authData.user.id,
          email,
          first_name,
          last_name,
          role: 'user',
          terms_accepted: termsAccepted,
          newsletter_subscribed: false
        })
        .select()
        .single();

      // Add logging for profile result
      if (profile) {
        console.log('Profile created successfully:', profile);
      }
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails, clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        res.status(500).json({ message: 'Error creating user profile' });
        return;
      }
    }

    // Fire and forget the welcome email
    emailService.sendWelcomeEmail(email, first_name)
      .catch(error => console.error('Welcome email error:', error));

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email,
        first_name,
        last_name
      }
    });
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
