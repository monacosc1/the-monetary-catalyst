// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { signToken } from '../services/jwtService';
import config from '../config/environment';
import { emailService } from '../services/emailService';

// Register User
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const { email, password, first_name, last_name, termsAccepted } = req.body;

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

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email,
        first_name,
        last_name,
        role: 'user',
        terms_accepted: termsAccepted
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({ message: 'Error creating user profile' });
      return;
    }

    // Fire and forget the welcome email
    emailService.sendWelcomeEmail(
      email,
      first_name
    )
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
    console.error('Unexpected error:', error);
    next(error);
  }
};

// Login User
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Fetch user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = signToken(user.id);

    res.status(200).json({ 
      message: 'User logged in successfully',
      user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
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
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      res.status(500).json({ message: 'Error fetching user profile', error: error.message });
      return;
    }

    if (!userProfile) {
      res.status(404).json({ message: 'User profile not found' });
      return;
    }

    res.status(200).json({ userProfile });
  } catch (error) {
    next(error);
  }
};
