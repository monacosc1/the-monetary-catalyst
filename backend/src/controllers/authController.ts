// src/controllers/authController.ts

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase';
import { signToken } from '../services/jwtService';
import config from '../config/environment';

// Register User
export const registerUser = async (req: Request, res: Response) => {
  // registration logic here
};

// Login User
export const loginUser = async (req: Request, res: Response) => {
  // login logic here
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
