import express from 'express';
import { createCheckoutSession, handleWebhook, verifySession, getPaymentMethod, createSetupIntent, cancelSubscription } from '../controllers/paymentController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Protected route - requires authentication
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);

// Webhook endpoint - no auth required, no body parsing
router.post('/webhook', handleWebhook);

// Session verification endpoint
router.get('/verify-session', authMiddleware, verifySession);

// Add these new routes
router.get('/get-payment-method', authMiddleware, getPaymentMethod);
router.post('/create-setup-intent', authMiddleware, createSetupIntent);
router.post('/cancel-subscription', authMiddleware, cancelSubscription);

export default router;
