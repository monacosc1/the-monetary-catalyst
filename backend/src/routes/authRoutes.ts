// src/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import { RequestHandler } from 'express';

// Create a router instance
const router = Router();

// Route for user registration
router.post('/register', registerUser as RequestHandler);

// Route for user login
router.post('/login', loginUser as RequestHandler);

// Route to get user profile (protected)
router.get('/profile', authMiddleware, getUserProfile as RequestHandler);

export default router;
