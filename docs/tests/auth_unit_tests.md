# Authentication and Newsletter Unit Testing Documentation

## Overview
The Monetary Catalyst uses Jest for unit testing to ensure the reliability of individual components in isolation. This document focuses on the authentication and newsletter subscription flows within the `backend/src/tests/unit/controllers/` directory. Our testing strategy emphasizes centralized mocks, consistent test data generation, and robust error handling. The core flows tested are:

- **Registration (`registerUser.test.ts`)**: Creating a new user, managing profiles, and syncing with existing newsletter subscriptions.
- **Login (`login.test.ts`)**: Validating credentials, fetching user profiles, and issuing JWT tokens.
- **Profile Retrieval (`getUserProfile.test.ts`)**: Fetching user profiles for authenticated requests.
- **Newsletter Subscription (`subscribe.test.ts`)**: Managing standalone newsletter signups and syncing with registered users.

These tests ensure that new features or changes do not break existing functionality.

## Directory Structure
```
backend/src/tests/
├── config/                     # Test configuration and setup
│   ├── setup.ts               # Test environment setup with Supabase client
│   └── teardown.ts            # Test cleanup and teardown
│
├── fixtures/                   # Test data factories
│   ├── users.ts               # User test data generators
│   ├── payments.ts            # Payment test data
│   ├── subscriptions.ts       # Subscription test data
│   └── newsletter.ts          # Newsletter test data
│
├── helpers/                    # Shared test utilities
│   ├── auth.ts                # Authentication test helpers
│   ├── database.ts            # Database operations for tests
│   ├── mocks.ts               # Centralized mock implementations
│   └── stripeMock.ts          # Stripe-specific mocks
│
├── integration/               # Integration tests
│   ├── auth/                  # Authentication integration tests
│   └── payment/               # Payment integration tests
│
├── types/                     # Test-specific type definitions
│   └── test.d.ts             # TypeScript declarations for tests
│
├── unit/                      # Unit tests
│   ├── controllers/          # Controller unit tests
│   │   ├── auth/            # Authentication controller tests
│   │   │   ├── login.test.ts
│   │   │   ├── registerUser.test.ts
│   │   │   └── getUserProfile.test.ts
│   │   ├── payment/         # Payment controller tests
│   │   │   ├── createSetupIntent.test.ts
│   │   │   ├── cancelSubscription.test.ts
│   │   │   ├── getPaymentMethod.test.ts
│   │   │   ├── handleWebhook.test.ts
│   │   │   ├── verifySession.test.ts
│   │   │   └── createCheckoutSession.test.ts
│   │   └── newsletter/      # Newsletter controller tests
│   │       └── subscribe.test.ts
│   ├── middleware/          # Middleware unit tests (currently empty)
│   └── services/            # Service layer unit tests (currently empty)
│
└── e2e/                      # End-to-end tests (currently empty)

```


## Core Components

### 1. Test Configuration (`/config`)
- **`setup.ts`**: Initializes the test Supabase client using `SUPABASE_URL` and `SUPABASE_API_KEY` from `.env.test`. Configures the environment with `NODE_ENV=test`.
- **`teardown.ts`**: Handles cleanup after tests (currently minimal but present).

### 2. Fixtures (`/fixtures`)
- **`users.ts`**:
  ```typescript
  export const userFixtures = {
    validUser: {
      email: 'test@example.com',
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User',
      termsAccepted: true
    }
  };

### 3. Helpers (`/helpers`)

#### Centralized Mocks (`mocks.ts`)
Defines reusable mocks for Supabase, Express, and email services:
```typescript
export const mockHelper = {
  createMockRequest: (data) => ({ body: {}, query: {}, params: {}, ...data }),
  createMockResponse: () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  }),
  createMockNext: () => jest.fn()
};

export const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    admin: { createUser: jest.fn(), deleteUser: jest.fn() }
  },
  from: jest.fn((table) => createMockQueryBuilder(table))
};

export const createMockQueryBuilder = (table) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  then: jest.fn().mockResolvedValue({ data: [], error: null })
});

export const resetMocks = () => {
  const originalFrom = mockSupabase.from.getMockImplementation();
  jest.clearAllMocks();
  mockSupabase.from.mockImplementation(originalFrom);
  mockSupabase.auth.signInWithPassword.mockReset();
  // ... additional resets
};
```

#### Database Helper (`database.ts`)
Manages test database state:
```typescript
export const databaseHelper = {
  cleanTables: async () => {
    await testSupabase
      .from(TABLES.USER_PROFILES) // Resolves to 'test_user_profiles' in test env
      .delete()
      .not('user_id', 'is', null);
  },
  createTestUser: async (userData) => {
    // Creates auth user and profile
  }
};
```

## Flow of a Typical Test

### 1. Test Setup
```typescript
beforeEach(async () => {
  const originalFromImpl = mockSupabase.from.getMockImplementation();
  resetMocks();
  mockSupabase.from.mockImplementation(originalFromImpl);
  await databaseHelper.cleanTables();
});
```

### 2. Test Cases
**getUserProfile.test.ts**
- Purpose: The getUserProfile.test.ts file focuses exclusively on the logic for retrieving a user’s profile from the test_user_profiles table. It validates that when the request contains a valid user (attached to req.user by middleware), the controller retrieves the correct profile and returns it with an HTTP 200 status. It also tests error scenarios:
- Key Tests:
  - Valid Token: Returns profile with status 200.
  - No User Attached: Returns 401 Unauthorized if req.user is missing.
  - Database Error: Returns 500 if Supabase returns an error during profile fetch.
  - Profile Not Found: Returns 404 if no profile exists for the user ID.

**login.test.ts**
- Purpose: The login.test.ts file tests the login flow by simulating a call to supabase.auth.signInWithPassword. It verifies that when correct credentials are provided, the controller fetches the corresponding user profile from test_user_profiles and returns a successful response (200) with a JWT token. It also confirms appropriate handling of key tests below.

- Key Tests:
  - Successful Login: Returns 200 with user data and token.
  - Invalid Credentials: Returns 401.
  - Profile Fetch Error: Returns 500.

**registerUser.test.ts**
- Purpose: Tests the registerUser controller, which creates an auth user, manages profiles, and syncs with newsletter subscriptions. The registerUser.test.ts file verifies the complete registration flow, including handling of newsletter subscribers. It ensures that when a new user submits valid registration data (email, password, first/last name, terms acceptance), the backend:
  - Creates an auth user using supabase.auth.admin.createUser.
  - Checks for an existing profile in test_user_profiles.
  - Inserts a new profile or updates an existing one.
  - Fires off a welcome email (fire-and-forget).
  - If the email exists in test_newsletter_users as an active subscriber, links the subscription by updating user_id and sets newsletter_subscribed: true in the profile.

- Key Tests:
  - New User: Creates user and profile, returns 201.
  - Duplicate Email: Returns 400.
  - Terms Not Accepted: Returns 400.
  - Invalid Email: Returns 400.
  - Newsletter Subscriber: Links subscription, sets newsletter_subscribed: true.
  - Cross-Table Synchronization: Between auth.users, test_user_profiles, and test_newsletter_users.


**subscribe.test.ts**
- Purpose: Tests the subscribeToNewsletter controller, which manages newsletter subscriptions in test_newsletter_users and syncs with test_user_profiles. It ensures:
  - New Subscriber: Adds a row to test_newsletter_users with status: 'active' and sends a welcome email (returns 201).
  - Duplicate Subscriptions: Returns 400 for active subscribers.
  - Invalid Email Format: Returns 400 if email validation fails.
  - Missing Required Fields: Returns 400 if email, name, or source is omitted.
  - Existing Registered User: Updates test_user_profiles (newsletter_subscribed: true) and adds to test_newsletter_users with user_id (returns 201).
  - Reactivation: Reactivates unsubscribed users in test_newsletter_users, clears unsubscribed_at, sends a welcome-back email (returns 200).
  - Database Error: Returns 500 if profile check fails.
  - Cross-Table Synchronization: Ensures updates between test_newsletter_users and test_user_profiles when applicable.


### 3. Example: Successful Login
```typescript
it('should successfully login user', async () => {
  const testUser = userFixtures.validUser;
  mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
    data: { user: { id: TEST_USER_ID, email: testUser.email }, session: {} },
    error: null
  });
  mockSupabase.from.mockImplementation(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { user_id: TEST_USER_ID, ...testUser }, error: null })
  }));
  const mockReq = mockHelper.createMockRequest({ body: testUser });
  const mockRes = mockHelper.createMockResponse();
  await loginUser(mockReq as any, mockRes as any, jest.fn());
  expect(mockRes.status).toHaveBeenCalledWith(200);
  expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
});
```

## Best Practices
**Mock Management:**
  - Preserve the original mockSupabase.from implementation in beforeEach/afterEach to ensure consistent cleanup (lesson from login.test.ts fix).
  - Use test-specific overrides only after cleanup.

**Database Operations:**
- Always clean tables with databaseHelper.cleanTables() before each test.
- Leverage TABLES constants for test-specific table names (e.g., test_user_profiles).

**Logging:**
- Use extensive console.log statements for debugging mock states and test flow, a project convention.

**Error Handling:**
- Test both success and failure scenarios to ensure robustness.

## Running Tests
```typescript
npm test  # Run all tests
npm test -- src/tests/unit/controllers/auth/login.test.ts  # Specific file
npm test -- --coverage  # With coverage report
```

### Environment Setup
**Config:** Uses .env.test with SUPABASE_URL and SUPABASE_API_KEY.

**Database:** Tests run against the development Supabase database (the-monetary-catalyst), using test tables (e.g., test_user_profiles) distinct from production (the-monetary-catalyst-prod).

### Common Patterns
Mock Restoration
```typescript
const originalFromImpl = mockSupabase.from.getMockImplementation();
beforeEach(() => {
  resetMocks();
  mockSupabase.from.mockImplementation(originalFromImpl);
});
```

Database Cleanup
```typescript
await testSupabase.from(TABLES.USER_PROFILES).delete().not('user_id', 'is', null);
```

Error Simulation
```typescript
mockSupabase.from(TABLES.USER_PROFILES).single.mockResolvedValue({ data: null, error: { message: 'Database error' } });
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


### 9. Testing Registration with Newsletter Subscriber Conversion
The purpose:
- This set of tests verifies the complete registration flow, including the handling of newsletter subscribers. It ensures that:
- When a new full registration is performed, an auth user is created and a corresponding profile is inserted or updated.
- If the email already exists as a newsletter subscriber, the profile’s newsletter_subscribed field is set to true and the newsletter subscription record is updated (linked with the new user ID).




### Key Improvements
- **Updated Structure**: Reflects your full directory with accurate file presence.
- **Test Descriptions**: Detailed purposes and key test cases for all four files, aligned with controller logic.
- **Mock Accuracy**: Updated `mocks.ts` snippets to match the current working version.
- **Environment Clarity**: Specifies the dev database and test table prefixing.
- **Lessons Learned**: Incorporated the `login.test.ts` fix in "Best Practices".
- **Conciseness**: Balanced detail with readability for new developers and maintainers.