// src/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
import { RequestHandler } from 'express';
import express from 'express';
import { emailService } from '../services/emailService';

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

export default router;
