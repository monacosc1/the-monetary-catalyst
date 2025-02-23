# Unit Testing Documentation

## Overview
The Monetary Catalyst uses Jest for unit testing, with a focus on testing individual components in isolation. Our testing strategy emphasizes centralized mocks, consistent test data generation, and clear separation of concerns. Each core authentication flow—registration, login, and profile retrieval—is tested independently to ensure that new feature changes do not break existing functionality.
- **Registration:** Creating a new user and associated profile.
- **Login:** Validating credentials, fetching the user profile, and issuing a JWT.
- **Profile Retrieval:** Fetching an existing user profile based on an authenticated request.
- **Newsletter Subscription:** Managing subscriptions to our newsletter.

## Directory Structure
```
backend/src/tests/
├── config/                 # Test configuration and setup
│   ├── setup.ts           # Test environment setup, database initialization
│   └── teardown.ts        # Cleanup, database teardown
├── fixtures/              # Test data factories
│   ├── users.ts           # User data generators
│   ├── newsletter.ts      # Newsletter test data
│   └── payments.ts        # Payment/subscription test data
├── helpers/               # Shared test utilities
│   ├── auth.ts           # Authentication test helpers
│   ├── database.ts       # Database operations for tests
│   └── mocks.ts          # Centralized mock implementations
├── integration/           # Integration tests
│   ├── auth/             # Auth integration tests
│   └── payment/          # Payment integration tests
├── unit/                 # Unit tests
│   └── controllers/      # Controller unit tests
└── types/                # Test-specific type definitions
    └── test.d.ts         # TypeScript declarations for tests
```

## Core Components

### 1. Test Configuration (`/config`)
```typescript
// setup.ts
export const testSupabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_KEY!
);

export const setupTestEnvironment = async () => {
  // Initialize test database
  // Set up test tables
  // Configure test environment
};
```

### 2. Fixtures (`/fixtures`)
```typescript
// users.ts
export const generateUniqueUser = () => ({
  email: `test-${Date.now()}@example.com`,
  first_name: 'Test',
  last_name: 'User',
  password: 'password123',
  termsAccepted: true
});

export const userFixtures = {
  validUser: {
    email: 'test@example.com',
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
    termsAccepted: true
  },
  invalidUsers: { /* ... */ }
};

```

### 3. Helpers (`/helpers`)

#### Centralized Mocks (`mocks.ts`)
Our global mocks include a comprehensive query builder that mimics the full Supabase client API:
```typescript
export const mockHelper = {
  // Request/Response helpers
  createMockRequest: (data: any = {}): Partial<Request> => ({
    body: {},
    query: {},
    params: {},
    ...data
  }),

  createMockResponse: (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  createMockNext: (): NextFunction => jest.fn()
};

export const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn()
    }
  },
  from: jest.fn().mockImplementation((table: string) => {
    console.log(`Creating mock query builder for table: ${table}`);
    
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          ...defaultResponses.profile,
          role: 'user',
          terms_accepted: true,
          newsletter_subscribed: false
        },
        error: null
      })
    };

    // Add thenable behavior to simulate promise chaining.
    (queryBuilder as any).then = (onFulfilled: any, onRejected: any) =>
      Promise.resolve(queryBuilder).then(onFulfilled, onRejected);

    return {
      ...queryBuilder,
      mockSuccess: (data: any) => {
        console.log('mockSuccess called with:', data);
        queryBuilder.single.mockResolvedValueOnce({ data, error: null });
        return queryBuilder;
      },
      mockError: (message: string) => {
        console.log('mockError called with:', message);
        queryBuilder.single.mockResolvedValueOnce({
          data: null,
          error: { message, code: 'TEST_ERROR' }
        });
        return queryBuilder;
      }
    };
  })
};

export const resetMocks = () => {
  // Capture the original implementation using getMockImplementation()
  const originalFromImpl = mockSupabase.from.getMockImplementation();
  
  jest.clearAllMocks();
  
  // Restore the global query builder implementation
  mockSupabase.from.mockReset();
  mockSupabase.from.mockImplementation(originalFromImpl);
  
  // Reset auth methods
  mockSupabase.auth.signInWithPassword.mockReset();
  mockSupabase.auth.admin.createUser.mockReset();
  mockSupabase.auth.admin.deleteUser.mockReset();
  
  // Reset JWT and email service mocks
  (signToken as jest.Mock).mockReturnValue('test-jwt-token');
  (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(true);
  (emailService.validateEmail as jest.Mock).mockResolvedValue(true);
};
```

#### Database Helper (`database.ts`)
```typescript
export const databaseHelper = {
  verifyTestEnvironment() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Must run in test environment');
    }
  },

  cleanTables: async () => {
    console.log('\n=== Database Cleanup Starting ===');
    // Log query builder state before cleanup
    const qb = testSupabase.from(TABLES.USER_PROFILES);
    console.log('Query builder state in cleanTables:', {
      isQueryBuilderDefined: !!qb,
      hasDelete: !!qb?.delete,
      hasNot: !!qb?.not,
      methods: qb ? Object.keys(qb) : 'undefined'
    });
    try {
      await Promise.all([
        // Wrap the cleanup chain in a Promise to simulate asynchronous behavior
        new Promise((resolve, reject) => {
          try {
            const result = testSupabase
              .from(TABLES.USER_PROFILES)
              .delete()
              .not('user_id', 'is', null);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
          .then(() => console.log('Successfully cleaned USER_PROFILES'))
          .catch((err: any) => console.error('Error cleaning USER_PROFILES:', err)),
        // ... other table cleanups if needed
      ]);
      console.log('All tables cleaned successfully');
    } catch (error) {
      console.error('Error during table cleanup:', error);
      throw error;
    }
    console.log('=== Database Cleanup Complete ===\n');
  },

  setupTestDatabase: async () => {
    this.verifyTestEnvironment();
    await this.cleanTables();
    return true;
  },

  createTestUser: async (userData: any) => {
    const { data: authData, error: authError } = await testSupabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) throw authError;

    const { data: profile, error: profileError } = await testSupabase
      .from(TABLES.USER_PROFILES)
      .upsert({
        user_id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: 'user',
        terms_accepted: true,
        newsletter_subscribed: false
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (profileError) throw profileError;

    return { user: authData.user, profile };
  }
};
```

## Flow of a Typical Test

### 1. Test Setup
```typescript
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import { generateUniqueUser } from '../../../fixtures/users';

describe('Auth Controller - Login', () => {
  beforeEach(async () => {
    await databaseHelper.cleanTables();
    resetMocks();
  });
```

### 2. Test Data Preparation
```typescript
it('should successfully login user', async () => {
  const testUser = generateUniqueUser();
  await databaseHelper.createTestUser(testUser);
```

### 3. Mock Setup
```typescript
  const mockReq = mockHelper.createMockRequest({
    body: { email: testUser.email, password: testUser.password }
  });
  const mockRes = mockHelper.createMockResponse();
  const mockNext = mockHelper.createMockNext();

  mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
    data: {
      user: {
        id: testUser.id || 'test-id',
        email: testUser.email,
        role: 'authenticated',
        aud: 'authenticated',
        user_metadata: {
          first_name: testUser.first_name,
          last_name: testUser.last_name
        }
      },
      session: {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_at: Date.now() + 3600000
      }
    },
    error: null
  });
```

### 4. Test Execution and Verification
```typescript
  await loginUser(mockReq as any, mockRes as any, mockNext);
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'User logged in successfully',
      user: expect.objectContaining({
        id: expect.any(String),
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name
      }),
      token: expect.any(String)
    })
  );
});
```

### 5. Testing getUserProfile
The purpose of getUserProfile.test.ts is:
- Focuses exclusively on the logic for retrieving a user’s profile.
- Validates that when the request contains a valid user (attached to req.user), the controller retrieves the correct profile from the USER_PROFILES table and returns it (HTTP 200).
- Additionally, it tests the behavior when:
  - No user is attached (should return 401 Unauthorized)
  - A database error occurs (should return 500)
  - The profile is not found (should return 404)

Separate test file getUserProfile.test.ts focuses solely on fetching a profile:
- Validate that when a valid user is attached to the request, the profile is fetched from test_user_profiles and returned with status 200.
- Verify proper error handling (e.g., missing user → 401, database errors → 500, profile not found → 404).

```typescript
describe('Auth Controller - Get User Profile', () => {
  beforeEach(async () => {
    await databaseHelper.cleanTables();
    resetMocks();
  });

  it('should return user profile when valid token provided', async () => {
    const user = { id: 'test-id', email: 'test@example.com' };
    const profile = { /* profile data */ };
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: profile, error: null })
    };
    mockSupabase.from.mockImplementation((table) => {
      expect(table).toBe(TABLES.USER_PROFILES);
      return mockQueryBuilder;
    });
    const mockReq = mockHelper.createMockRequest({ user: { id: user.id } });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();
    await getUserProfile(mockReq as any, mockRes as any, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ profile: expect.objectContaining(profile) });
  });
});
```

### 6. Testing Registration
In registerUser.test.ts, we test:
- Registration of newsletter subscribers (links accounts, preserves subscription)
- Cross-table synchronization between auth.users, user_profiles, and newsletter_users
The purpose of registerUser.test.ts is:
- Verifies the complete registration flow.
- Ensures that when a new user submits valid registration data (email, password, first/last name, terms acceptance), the backend:
  - Creates an auth user using supabase.auth.admin.createUser
  - Checks for an existing profile in the USER_PROFILES (or test version thereof) table
  - Inserts a new profile (or updates an existing one) accordingly
  - Fires off a welcome email (fire-and-forget)
- Also tests error scenarios (e.g. duplicate email, missing terms, invalid email format).
- Should test the complete registration flow for full users.
- It must simulate cases where the email is new (resulting in creation of both auth and user_profiles records) and error scenarios (e.g., duplicate email, missing required fields, invalid email format).
- It should also cover the case when a user who is already a newsletter subscriber registers fully—verifying that the newsletter_users table is updated accordingly (linking the user ID and setting the newsletter_subscribed flag).

### 7. Testing Login
The purpose of login.test.ts is: 
- Tests the login flow by simulating a call to supabase.auth.signInWithPassword.
- Verifies that when correct credentials are provided, the controller fetches the corresponding user profile and returns a successful response including a JWT token.
- Also confirms that invalid credentials or profile fetch errors are handled appropriately.

### 8. Testing Newsletter Subscription
In the separate newsletter test file (e.g., subscribe.test.ts), we test:

- Successful subscription for a new user.
- Handling of duplicate subscriptions.
- Invalid email format.
- Missing required fields.
- Subscription for existing registered users (updates both tables).
- Reactivation of previously unsubscribed users.
- Cross-table synchronization between newsletter_users and user_profiles.
- Database error handling during profile checks.
- Should test the newsletter subscription flow independently.
It should simulate a new newsletter signup (adding a row to newsletter_users with no auth account), as well as:
- Handling duplicate subscriptions.
- Invalid email formats.
- Missing required fields.
- The scenario where an already registered user subscribes to the newsletter (ensuring that the system updates both newsletter_users and user_profiles appropriately).
- Reactivation of previously unsubscribed users.
These tests cover the standalone newsletter subscription flow. They ensure that:
- A new subscriber (providing only email and name) is added to the newsletter_users table.
- Duplicate subscriptions are handled gracefully.
- Invalid input (e.g., malformed email, missing fields) results in an error.
- For existing registered users, the process updates the subscription status in both the newsletter_users table and the user_profiles table if necessary.
```typescript
// In subscribe.test.ts
it('should subscribe new user to newsletter', async () => {
  const testSubscription = {
    email: 'test@example.com',
    name: 'Test User',
    source: 'website'
  };

  // Ensure the subscriber does not already exist:
  mockSupabase.from('test_newsletter_users').mockSuccess(null);

  // Mock the insertion of a new subscriber:
  mockSupabase.from('test_newsletter_users').mockSuccess({
    id: 1,
    email: testSubscription.email,
    name: testSubscription.name,
    source: testSubscription.source,
    status: 'active',
    subscribed_at: expect.any(String)
  });

  const mockReq = mockHelper.createMockRequest({ body: testSubscription });
  const mockRes = mockHelper.createMockResponse();

  await subscribeToNewsletter(mockReq as any, mockRes as any);

  expect(mockRes.status).toHaveBeenCalledWith(201);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
      message: expect.stringContaining('Successfully subscribed')
    })
  );
  expect(emailService.sendNewsletterWelcomeEmail)
    .toHaveBeenCalledWith(testSubscription.email, testSubscription.name);
});
```

### 9. Testing Registration with Newsletter Subscriber Conversion
The purpose:
- This set of tests verifies the complete registration flow, including the handling of newsletter subscribers. It ensures that:
- When a new full registration is performed, an auth user is created and a corresponding profile is inserted or updated.
- If the email already exists as a newsletter subscriber, the profile’s newsletter_subscribed field is set to true and the newsletter subscription record is updated (linked with the new user ID).

```typescript
// In registerUser.test.ts
it('should handle registration for existing newsletter subscriber', async () => {
  // Test data simulating a newsletter subscriber:
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
    termsAccepted: true
  };

  // Mock auth user creation
  const mockAuthData = {
    data: {
      user: {
        id: TEST_USER_ID,
        email: testUser.email
      }
    },
    error: null
  };
  mockSupabase.auth.admin.createUser.mockResolvedValueOnce(mockAuthData);

  // Simulate an existing newsletter subscription:
  const mockNewsletterData = {
    id: 1,
    email: testUser.email,
    status: 'active'
  };
  // This mock will be used when the newsletter_users table is queried:
  mockSupabase.from(TABLES.NEWSLETTER_USERS)
    .mockSuccess(mockNewsletterData);

  // Configure the profile query builder to return a profile with newsletter_subscribed set to true:
  setupMockFrom(testUser, { exists: false, newsletterSubscribed: true });

  const mockReq = mockHelper.createMockRequest({ body: testUser });
  const mockRes = mockHelper.createMockResponse();
  const mockNext = mockHelper.createMockNext();

  await registerUser(mockReq as any, mockRes as any, mockNext);

  // The final response should include a profile with newsletter_subscribed: true
  expect(mockRes.status).toHaveBeenCalledWith(201);
  expect(mockRes.json).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'User registered successfully',
      user: expect.objectContaining({
        email: testUser.email,
        newsletter_subscribed: true
      })
    })
  );
});
```

## Best Practices

### 1. Mock Usage
- Centralized mocks (in mocks.ts) should provide full chainable behavior with thenable support.
- Use conditional overrides sparingly and always restore the global mock to prevent interference with cleanup.

### 2. Database Operations
- Always clean tables before tests, and ensure cleanup code works with a thenable query builder.
- Use test-specific tables (prefixed with 'test_')

### 3. Test Data
- Generate unique test data via fixtures and ensure tests do not leak state.

### 4. Error Handling
- Write tests to simulate both success and error scenarios to ensure robust behavior.

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/tests/unit/controllers/auth/login.test.ts

# Run with coverage
npm test -- --coverage
```

### Environment Setup
- Tests use `.env.test` configuration
- A separate test database is used (with test-specific tables).
- The environment is isolated from production.

## Common Patterns

### 1. Auth Testing
```typescript
// Test full registration flow, including newsletter subscriber conversion.
// This verifies that when a user registers, an auth user is created,
// a profile is inserted/updated with the correct newsletter_subscribed flag,
// and the newsletter subscription (if present) is linked appropriately.
const { user, profile } = await authHelper.createAuthenticatedUser(testUser);
expect(user).toBeTruthy();
expect(profile.newsletter_subscribed).toBe(expectedNewsletterStatus);
```

### 2. Database Verification
```typescript
// Verify database state in test-specific tables.
const { data: dbRecord } = await testSupabase
  .from('test_user_profiles')
  .select()
  .eq('id', recordId)
  .single();
expect(dbRecord).toMatchObject(expectedData);
```

### 3. Error Handling
```typescript
// Simulate and verify error scenarios.
mockSupabase.from('test_user_profiles').mockError('Database error');
await someFunction(mockReq, mockRes, mockNext);
expect(mockRes.status).toHaveBeenCalledWith(500);
expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    message: expect.any(String)
  })
);
```

### 4. Conditional Override & Thenable Cleanup for Registration Flow
```typescript
// In registration tests, conditionally override the Supabase query builder for the USER_PROFILES table:
const originalFromImpl = mockSupabase.from.getMockImplementation();

const setupProfileQueryBuilder = (testUser: any, options = { exists: false }) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  single: jest.fn()
    // First call: existing profile check returns no profile (or an existing one if options.exists is true)
    .mockResolvedValueOnce({
      data: options.exists ? { user_id: testUser.id, email: testUser.email } : null,
      error: null
    })
    // Second call: profile creation returns the new profile data
    .mockResolvedValueOnce({
      data: {
        user_id: testUser.id,
        email: testUser.email,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        role: 'user',
        terms_accepted: true,
        newsletter_subscribed: false
      },
      error: null
    })
});

// Override conditional implementation:
mockSupabase.from.mockImplementation((table: string) => {
  if (table === TABLES.USER_PROFILES) {
    return setupProfileQueryBuilder(testUser, { exists: false });
  }
  return originalFromImpl(table);
});

// For cleanup, ensure the chain is thenable by wrapping it:
const cleanupChain = Promise.resolve(
  testSupabase.from(TABLES.USER_PROFILES)
    .delete()
    .not('user_id', 'is', null)
);
cleanupChain.then(() => console.log('Cleanup successful')).catch(err => console.error('Cleanup error:', err));

// Finally, restore the global mock after test execution:
mockSupabase.from.mockReset();
mockSupabase.from.mockImplementation(originalFromImpl);
```

### 5. Newsletter Subscription Testing
```typescript
// For newsletter-specific flows, ensure that the correct tables are updated,
// the subscriber is created without full authentication credentials,
// and cross-table synchronization (if applicable) is maintained.
const { data: newsletterRecord } = await testSupabase
  .from('test_newsletter_users')
  .select()
  .eq('email', subscriberEmail)
  .single();
expect(newsletterRecord).toMatchObject(expectedNewsletterData);
```