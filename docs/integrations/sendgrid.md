# SendGrid Integration Documentation

## Overview
The Monetary Catalyst uses SendGrid for transactional emails and newsletter management. The integration handles welcome emails, newsletter subscriptions, password resets, and other system notifications.

## Configuration

### Environment Variables
```env
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@themonetarycatalyst.com
SENDGRID_SMTP_KEY=your_smtp_key
```

### Email Service Setup
```typescript
// services/emailService.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
```

## Email Templates

### Welcome Email
```typescript
interface WelcomeEmailData {
  to: string;
  name: string;
}

async function sendWelcomeEmail(email: string, name: string) {
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    templateId: 'd-xxxxxxxxxxxxxxxxxxxxxxxx',
    dynamicTemplateData: {
      name,
      loginUrl: `${process.env.FRONTEND_URL}/login`
    }
  });
}
```

### Newsletter Welcome
```typescript
interface NewsletterWelcomeData {
  to: string;
  name: string;
  source: string;
}

async function sendNewsletterWelcomeEmail(email: string, name: string) {
  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL!,
    templateId: 'd-xxxxxxxxxxxxxxxxxxxxxxxx',
    dynamicTemplateData: {
      name,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe`
    }
  });
}
```

## Webhook Integration

### Webhook Configuration
```typescript
// routes/emailWebhookRoutes.ts
router.post('/email-events', 
  verifySendGridWebhook,
  handleSendGridWebhook
);
```

### Event Handling
```typescript
interface SendGridEvent {
  email: string;
  timestamp: number;
  event: string;
  category: string[];
  sg_event_id: string;
  sg_message_id: string;
}

async function handleSendGridWebhook(req: Request, res: Response) {
  const events: SendGridEvent[] = req.body;
  
  for (const event of events) {
    switch (event.event) {
      case 'bounce':
        await handleBounce(event);
        break;
      case 'unsubscribe':
        await handleUnsubscribe(event);
        break;
      // ... other event handlers
    }
  }
}
```

### Webhook Security
```typescript
// middleware/sendgridWebhookVerification.ts
export const verifySendGridWebhook = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const signature = req.headers['x-twilio-email-event-webhook-signature'];
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'];
  
  // Verification logic
};
```

## Email Categories

### Transactional Emails
- Welcome emails
- Password reset
- Email verification
- Subscription confirmations
- Payment receipts

### Marketing Emails
- Newsletter
- Product updates
- Market analysis previews
- Special offers

## Template Management

### Dynamic Template Data
```typescript
interface EmailTemplateData {
  name: string;
  email: string;
  subject: string;
  content: string;
  unsubscribeUrl?: string;
  [key: string]: any;
}
```

### Template IDs
```typescript
const EMAIL_TEMPLATES = {
  WELCOME: 'd-xxxxxxxxxxxxxxxxxxxxxxxx',
  NEWSLETTER: 'd-xxxxxxxxxxxxxxxxxxxxxxxx',
  PASSWORD_RESET: 'd-xxxxxxxxxxxxxxxxxxxxxxxx',
  PAYMENT_CONFIRMATION: 'd-xxxxxxxxxxxxxxxxxxxxxxxx'
};
```

## Error Handling

### Email Service Errors
```typescript
try {
  await sendEmail(emailData);
} catch (error) {
  if (error.response) {
    console.error('SendGrid API Error:', error.response.body);
  }
  throw new Error('Failed to send email');
}
```

### Retry Logic
```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

async function sendWithRetry(emailData: EmailData, attempts = 0) {
  try {
    return await sendEmail(emailData);
  } catch (error) {
    if (attempts < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return sendWithRetry(emailData, attempts + 1);
    }
    throw error;
  }
}
```

## Monitoring and Analytics

### Event Tracking
- Bounces
- Opens
- Clicks
- Unsubscribes
- Spam reports

### Performance Metrics
- Delivery rates
- Open rates
- Click-through rates
- Bounce rates

## Best Practices

### Email Validation
```typescript
function isValidEmail(email: string): boolean {
  // Email validation logic
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Rate Limiting
```typescript
const EMAIL_RATE_LIMIT = 100; // emails per minute
const EMAIL_QUEUE = new Queue('email', { limiter: { max: EMAIL_RATE_LIMIT } });
```

### Compliance
- CAN-SPAM Act compliance
- GDPR compliance
- Unsubscribe mechanism
- Physical address inclusion
