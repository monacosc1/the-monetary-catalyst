# Integration Testing Documentation

## Overview
Integration tests for The Monetary Catalyst verify the interaction between different components of the system, focusing on API endpoints, database operations, and third-party service integrations.

## Test Structure

### Directory Organization
```
src/tests/
└── integration/
    ├── auth/
    │   └── authEndpoints.test.ts
    └── payment/
        ├── checkout.test.ts
        └── webhooks.test.ts
```

## Test Environment Setup

### Configuration
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./src/tests/setup.ts'],
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000  // Extended timeout for integration tests
};
```

### Environment Variables
```env
# .env.test
SUPABASE_URL=your_test_db_url
SUPABASE_KEY=your_test_key
STRIPE_SECRET_KEY=your_test_stripe_key
JWT_SECRET=test_secret
```

## Database Setup

### Test Database Configuration
```typescript
// setup.ts
import { supabase } from '../config/supabase';

beforeAll(async () => {
  // Clear test database tables
  await supabase.from('user_profiles').delete().neq('id', '0');
  await supabase.from('newsletter_users').delete().neq('id', '0');
});

afterAll(async () => {
  // Cleanup after tests
  await supabase.from('user_profiles').delete().neq('id', '0');
});
```

## API Testing Patterns

### Authentication Tests
```typescript
describe('Auth Endpoints (Integration)', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User',
        termsAccepted: true
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
  });

  it('should login existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Protected Route Testing
```typescript
describe('Protected Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login and get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });
    authToken = loginResponse.body.token;
  });

  it('should access protected route with token', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
  });
});
```

## Payment Integration Testing

### Stripe Checkout Tests
```typescript
describe('Payment Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup authentication
    authToken = await getTestUserToken();
  });

  it('should create Stripe checkout session', async () => {
    const response = await request(app)
      .post('/api/create-checkout-session')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        priceId: 'test_price_id'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(response.body.url).toContain('checkout.stripe.com');
  });
});
```

### Webhook Testing
```typescript
describe('Stripe Webhooks', () => {
  it('should handle successful payment webhook', async () => {
    const webhookEvent = createTestWebhookEvent('payment_intent.succeeded');
    
    const response = await request(app)
      .post('/api/webhook/stripe')
      .send(webhookEvent)
      .set('stripe-signature', 'test_signature');

    expect(response.status).toBe(200);
  });
});
```

## Test Utilities

### Authentication Helper
```typescript
// testUtils.ts
export const getTestUserToken = async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'Password123!'
    });
  return loginResponse.body.token;
};
```

### Database Helpers
```typescript
export const createTestUser = async () => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'Password123!'
  });
  return data?.user;
};

export const cleanupTestUser = async (userId: string) => {
  await supabase.auth.admin.deleteUser(userId);
};
```

## Best Practices

### Test Isolation
1. Use unique test data for each test
2. Clean up data after tests
3. Don't rely on test execution order
4. Use separate test database

### Error Handling
1. Test error scenarios
2. Verify error responses
3. Check error status codes
4. Validate error messages

### Performance
1. Use `beforeAll` for setup when possible
2. Clean up resources in `afterAll`
3. Minimize database operations
4. Use test timeouts appropriately

## Common Issues and Solutions

### Database Connection Issues
```typescript
// Handling connection timeouts
beforeAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  await supabase.from('user_profiles').delete().neq('id', '0');
});
```

### Authentication Failures
```typescript
// Refresh token if expired
beforeEach(async () => {
  if (isTokenExpired(authToken)) {
    authToken = await getTestUserToken();
  }
});
```

### Webhook Verification
```typescript
// Mock webhook signature verification
jest.mock('stripe', () => ({
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: {} }
    })
  }
}));
```

## Debugging Integration Tests

### Common Problems
1. **Database State Issues**
   - Use database logging
   - Check transaction rollback
   - Verify cleanup functions

2. **Authentication Problems**
   - Check token expiration
   - Verify token format
   - Validate user permissions

3. **Timing Issues**
   - Increase test timeouts
   - Add appropriate waits
   - Check async operations
