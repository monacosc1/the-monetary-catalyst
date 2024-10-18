// src/routes/authRoutes.ts

import { Router } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';

// Create a router instance
const router = Router();

// Route for user registration
router.post('/register', registerUser);

// Route for user login
router.post('/login', loginUser);

// Route to get user profile (protected)
router.get('/profile', authMiddleware, getUserProfile);

export default router;
