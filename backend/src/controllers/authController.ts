// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { signToken } from '../services/jwtService';
import config from '../config/environment';

// Register User
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email, password_hash: hashedPassword, name })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      res.status(500).json({ message: 'Error creating user', error: error.message });
      return;
    }

    // Generate JWT token
    const token = signToken(newUser.id);

    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      token 
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
      user: { id: user.id, email: user.email, name: user.name },
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
      .select('id, email, name, created_at')
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
