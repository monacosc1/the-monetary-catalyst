# Unit Testing Documentation

## Overview
The Monetary Catalyst uses Jest for unit testing, with a focus on testing individual components in isolation. Our testing strategy emphasizes centralized mocks, consistent test data generation, and clear separation of concerns.

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
  validUser: {...},
  invalidUsers: {...}
};
```

### 3. Helpers (`/helpers`)

#### Centralized Mocks (`mocks.ts`)
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
    return res;
  },

  createMockNext: (): NextFunction => jest.fn()
};

// Supabase mocks
export const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn()
  },
  from: jest.fn().mockImplementation((table) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    // ... other query methods
  }))
};
```

#### Database Helper (`database.ts`)
```typescript
export const databaseHelper = {
  cleanTables: async () => {
    // Clean test tables between tests
  },
  createTestUser: async (userData) => {
    // Create user in test database
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
    // Clean test database
    await databaseHelper.cleanTables();
    // Reset all mocks
    resetMocks();
  });
```

### 2. Test Data Preparation
```typescript
it('should successfully login user', async () => {
  // Generate test data using fixtures
  const testUser = generateUniqueUser();
  
  // Set up test database state
  await databaseHelper.createTestUser(testUser);
```

### 3. Mock Setup
```typescript
  // Create mock request/response
  const mockReq = mockHelper.createMockRequest({
    body: {
      email: testUser.email,
      password: testUser.password
    }
  });
  const mockRes = mockHelper.createMockResponse();
  const mockNext = mockHelper.createMockNext();

  // Configure Supabase mock responses
  mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
    data: { user: { id: 'test-id' } },
    error: null
  });
```

### 4. Test Execution and Verification
```typescript
  // Execute test
  await loginUser(mockReq as any, mockRes as any, mockNext);

  // Verify response
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockNext).not.toHaveBeenCalled();

  // Verify database state
  const { data: dbUser } = await testSupabase
    .from('test_user_profiles')
    .select()
    .eq('email', testUser.email)
    .single();

  expect(dbUser).toBeTruthy();
});
```

## Best Practices

### 1. Mock Usage
- Use centralized mocks from `mocks.ts`
- Reset mocks before each test
- Use mock helpers for consistent request/response objects
- Configure specific mock responses for each test case

### 2. Database Operations
- Always clean tables before tests
- Use test-specific tables (prefixed with 'test_')
- Use database helper functions for common operations
- Verify database state after operations

### 3. Test Data
- Use fixtures for consistent test data
- Generate unique data when needed
- Keep test data isolated between tests
- Use type-safe fixtures

### 4. Error Handling
```typescript
it('should handle errors appropriately', async () => {
  // Use mock helpers for error responses
  mockSupabase.from('test_user_profiles').mockError('Database error');

  await someFunction(mockReq, mockRes, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(500);
});
```

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
- Separate test database
- Test-specific Supabase project
- Isolated test environment

## Common Patterns

### 1. Auth Testing
```typescript
// Test authentication flow
const { user, profile } = await authHelper.createAuthenticatedUser(testUser);
expect(user).toBeTruthy();
```

### 2. Database Verification
```typescript
// Verify database state
const { data: dbRecord } = await testSupabase
  .from('test_user_profiles')
  .select()
  .eq('id', recordId)
  .single();

expect(dbRecord).toMatchObject(expectedData);
```

### 3. Error Handling
```typescript
// Test error scenarios
mockSupabase.from('test_user_profiles').mockError('Database error');

await someFunction(mockReq, mockRes, mockNext);

expect(mockRes.status).toHaveBeenCalledWith(500);
expect(mockRes.json).toHaveBeenCalledWith(
  expect.objectContaining({
    message: expect.any(String)
  })
);
```
