# Security Documentation

## Overview
The Monetary Catalyst implements multiple layers of security to protect user data, payment information, and system integrity. This document outlines our security architecture and practices.

## Authentication Security

### JWT Implementation
```typescript
interface JWTConfig {
  algorithm: 'HS256';
  expiresIn: '24h';
  issuer: 'themonetarycatalyst.com';
}

// Token validation
const validateToken = async (token: string): Promise<DecodedToken> => {
  try {
    const decoded = await supabase.auth.getUser(token);
    return decoded;
  } catch (error) {
    throw new AuthError('Invalid token');
  }
};
```

<!-- Session cookies are not used; Supabase JS stores JWT client-side. -->

## API Security

### Request Validation
```typescript
// Middleware for request validation
const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }
    next();
  };
};
```

### Rate Limiting
```typescript
// Rate limiting configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
```

## Data Security

### Database Security
```sql
-- Row Level Security Policies
CREATE POLICY "Users can only read their own data"
ON user_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their subscriptions"
ON subscriptions
FOR ALL
USING (user_id = auth.uid());
```

### Data Encryption
```typescript
interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyLength: 32;
  ivLength: 16;
  tagLength: 16;
}

// Sensitive data encryption
const encryptData = (data: string): EncryptedData => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  // Encryption implementation
};
```

## Payment Security

### Stripe Integration
```typescript
// Stripe subscription via Checkout Session
const createCheckoutSession = async ({ priceId, customerId }: Params) => {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.FRONTEND_URL}/pricing`
  });
};
```

### Webhook Security
```typescript
// Webhook signature verification
const verifyStripeWebhook = (
  payload: Buffer,
  signature: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
};
```

## Infrastructure Security

### CORS Configuration
```typescript
// CORS policy
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL!,
    'https://checkout.stripe.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
```

### Headers Security
```typescript
// Security headers middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL],
      frameSrc: ['js.stripe.com'],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}));
```

## Error Handling

### Security Error Handling
```typescript
interface SecurityError extends Error {
  code: string;
  status: number;
}

const handleSecurityError = (error: SecurityError, res: Response) => {
  // Log error securely (no sensitive data)
  logger.error({
    code: error.code,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  // Return safe error response
  res.status(error.status).json({
    error: 'Security error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : error.message
  });
};
```

## Access Control

### Role-Based Access Control
```typescript
interface RBACConfig {
  roles: {
    admin: string[];
    user: string[];
    guest: string[];
  };
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
  };
}

const checkPermission = (
  user: User,
  requiredPermission: string
): boolean => {
  const userRole = user.role;
  return RBACConfig.roles[userRole].includes(requiredPermission);
};
```

## Security Monitoring

### Audit Logging
```typescript
interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  status: 'success' | 'failure';
}

const logSecurityEvent = async (event: AuditLog) => {
  await supabase
    .from('security_logs')
    .insert(event);
};
```

### Intrusion Detection
```typescript
const detectSuspiciousActivity = ({
  ip,
  userId,
  action
}: SecurityEvent) => {
  // Rate of failed attempts
  // Unusual access patterns
  // Geographic anomalies
};
```

## Security Best Practices

### Password Policy
```typescript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  maxAge: 90 // days
};
```

### Data Sanitization
```typescript
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};
```
