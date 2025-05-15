# Backend Architecture Documentation

## Overview
The backend of The Monetary Catalyst is built with Express.js and TypeScript, providing a RESTful API that handles authentication, payment processing, content management, and email services. The architecture follows a modular approach with clear separation of concerns.

## Directory Structure
backend/
├── src/
│ ├── config/ # Configuration files
│ │ ├── dbConfig.ts # Database configuration
│ │ ├── environment.ts # Environment variables
│ │ └── supabase.ts # Supabase client setup
│ │
│ ├── controllers/ # Request handlers
│ │ ├── authController.ts # Authentication logic
│ │ ├── contentController.ts # Content management
│ │ ├── newsletterController.ts # Newsletter operations
│ │ ├── paymentController.ts # Payment processing
│ │ ├── subscriptionController.ts # Subscription management
│ │ └── webhookController.ts # Webhook handling
│ │
│ ├── middleware/ # Express middleware
│ │ ├── authMiddleware.ts # Authentication checks
│ │ └── sendgridWebhookVerification.ts # Webhook verification
│ │
│ ├── models/ # Data models
│ │ ├── articleModel.ts # Content structure
│ │ ├── paymentModel.ts # Payment data
│ │ ├── subscriptionModel.ts # Subscription data
│ │ └── userModel.ts # User data
│ │
│ ├── routes/ # API routes
│ │ ├── authRoutes.ts # Authentication endpoints
│ │ ├── contactRoutes.ts # Contact form handling
│ │ ├── contentRoutes.ts # Content endpoints
│ │ ├── emailWebhookRoutes.ts # Email webhook handling
│ │ ├── newsletterRoutes.ts # Newsletter endpoints
│ │ ├── paymentRoutes.ts # Payment endpoints
│ │ └── webhookRoutes.ts # Webhook endpoints
│ │
│ ├── services/ # Business logic
│ │ ├── emailService.ts # Email functionality
│ │ ├── jwtService.ts # JWT token handling
│ │ ├── paymentService.ts # Payment processing
│ │ └── stripeService.ts # Stripe integration
│ │
│ ├── types/ # TypeScript definitions
│ │ ├── auth.ts # Authentication types
│ │ ├── express.d.ts # Express type extensions
│ │ ├── newsletter.ts # Newsletter types
│ │ ├── payment.ts # Payment types
│ │ └── subscription.ts # Subscription types
│ │
│ └── index.ts # Application entry point
│
├── .env # Environment variables (gitignored)
├── .env.example # Example environment variables
├── .gitignore # Git ignore rules
├── package.json # Project dependencies
├── package-lock.json # Dependency lock file
└── tsconfig.json # TypeScript configuration

## Core Architectural Patterns

### API Layer Organization
The API follows a layered architecture:

```typescript
// Routes -> Controllers -> Services -> Models

// 1. Route Definition
router.post('/subscribe', subscribeToNewsletter);

// 2. Controller Logic
export const subscribeToNewsletter = async (req: Request, res: Response) => {
  try {
    // 3. Service Layer Call
    await emailService.subscribe(req.body);
    // 4. Response Handling
    res.status(200).json({ success: true });
  } catch (error) {
    handleError(error, res);
  }
};
```

### Middleware Implementation
```typescript
// Authentication Middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    // Verify token and attach user to request
    req.user = await verifyToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

### Service Layer Pattern
```typescript
// Service Layer Example
export const emailService = {
  async sendWelcomeEmail(user: User): Promise<void> {
    // Email sending logic
  },
  
  async validateEmail(email: string): Promise<boolean> {
    // Email validation logic
  }
};
```

### Database Integration
```typescript
// Supabase Integration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});
```

## Integration Patterns

### Stripe Integration
```typescript
// Payment Processing
export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { priceId } = req.body;

  const customerId = await createCustomer(userId, req.user?.email);
  
  const baseUrl = getBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing`,
    client_reference_id: userId,
    metadata: { userId, environment: process.env.NODE_ENV || 'development' }
  });

  res.json({ url: session.url });
};
```

### Email Service Integration
```typescript
// SendGrid Integration
export const sendEmail = async (to: string, template: string, data: any) => {
  await sgMail.send({
    to,
    templateId: template,
    dynamicTemplateData: data
  });
};
```

## Error Handling

### Global Error Handler
```typescript
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});
```

### Type-Safe Error Handling
```typescript
interface ApiError extends Error {
  statusCode: number;
  code: string;
}

const handleError = (error: ApiError, res: Response) => {
  res.status(error.statusCode).json({
    error: error.message,
    code: error.code
  });
};
```

## Security Patterns

### Request Validation
```typescript
const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};
```

### Webhook Verification
```typescript
const verifyStripeWebhook = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['stripe-signature'];
  try {
    stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    next();
  } catch (error) {
    res.status(400).send('Webhook verification failed');
  }
};
```

## Performance Considerations

### Request Rate Limiting
```typescript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### Response Caching
```typescript
const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Caching logic
  };
};
```
