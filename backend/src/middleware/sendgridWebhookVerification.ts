import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export const verifySendGridWebhook = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const signature = req.headers['x-twilio-email-event-webhook-signature'];
    const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
    const key = process.env.SENDGRID_WEBHOOK_SIGNING_KEY;

    if (!signature || !timestamp || !key) {
      res.status(401).json({ error: 'Missing webhook verification headers' });
      return;
    }

    const payload = timestamp + JSON.parse(req.body.toString());
    const hmac = crypto.createHmac('sha256', key)
      .update(payload)
      .digest('base64');

    if (hmac !== signature) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    res.status(500).json({ error: 'Webhook verification failed' });
  }
}; 