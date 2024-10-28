import express from 'express';
import { createCheckoutSession, handleWebhook, verifySession } from '../controllers/paymentController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Protected route - requires authentication
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);

// Webhook endpoint - no auth required
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Add this new route to your existing routes
router.get('/verify-session', authMiddleware, verifySession);

export default router;
