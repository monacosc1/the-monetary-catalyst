import express from 'express';
import { handleSendGridWebhook } from '../controllers/webhookController';
import { verifySendGridWebhook } from '../middleware/sendgridWebhookVerification';

const router = express.Router();

// SendGrid webhook endpoint
router.post('/webhook/sendgrid', 
  express.raw({ type: 'application/json' }), 
  verifySendGridWebhook,
  handleSendGridWebhook
);

export default router; 