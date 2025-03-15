// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import supabase from '../config/supabase';

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    console.log('Auth Middleware - Received token:', {
      tokenPresent: !!token,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'None',
      tokenLength: token ? token.length : 0,
      fullHeaders: req.headers
    });

    if (!token) {
      console.log('Auth Middleware - No token provided in request');
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('Auth Middleware - Supabase response:', {
      userId: user?.id,
      errorMessage: error?.message,
      errorDetails: error ? JSON.stringify(error) : null
    });

    if (error || !user) {
      console.log('Auth Middleware - Token validation failed:', {
        token,
        error: error?.message || 'No user returned'
      });
      res.status(401).json({ message: 'Invalid token', error: error?.message });
      return;
    }

    console.log('Auth Middleware - Token validated successfully:', {
      userId: user.id,
      email: user.email
    });

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware - Unexpected error during authentication:', error);
    res.status(401).json({ message: 'Authentication failed', error: (error as Error).message });
  }
};

export default authMiddleware;