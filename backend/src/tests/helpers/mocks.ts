// /backend/src/tests/helpers/mocks.ts
import { AuthError as SupabaseAuthError, PostgrestSingleResponse, PostgrestError } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { signToken } from '../../services/jwtService';
import { emailService } from '../../services/emailService';

// MockResponse interface for Express response mocks
interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
}

// AuthResponse type for Supabase auth responses
export type AuthResponse = {
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      aud: string;
      user_metadata?: {
        first_name?: string;
        last_name?: string;
      };
    } | null;
    session: {
      access_token: string;
      expires_at: number;
      refresh_token: string;
      user: {
        id: string;
        email: string;
      };
    } | null;
  } | null;
  error: (SupabaseAuthError | Error) | null;
};

// Mock helpers for requests, responses, and utilities
export const mockHelper = {
  createMockRequest: (data: any = {}): Partial<Request> => ({
    body: {},
    query: {},
    params: {},
    ...data
  }),

  createMockResponse(): MockResponse {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    return res as MockResponse;
  },

  createMockNext(): NextFunction {
    return jest.fn();
  },

  stripe: {
    createCheckoutSession: {
      success: {
        id: 'test_session_id',
        url: 'https://checkout.stripe.com/test'
      },
      error: new Error('Stripe checkout creation failed')
    }
  },

  sendgrid: {
    sendEmail: {
      success: { statusCode: 202 },
      error: new Error('Email sending failed')
    }
  },

  cleanTables: jest.fn(() => Promise.resolve())
};

// Fallback to native Error if SupabaseAuthError isn’t available
const BaseAuthError = typeof SupabaseAuthError !== 'undefined' ? SupabaseAuthError : Error;

// Custom AuthError class for mock errors
class TestAuthError extends Error {
  public name: string;
  public status: number;
  public code: string;
  
  constructor(message: string, status = 400) {
    super(message);
    Object.setPrototypeOf(this, TestAuthError.prototype);
    this.name = 'AuthApiError';
    this.status = status;
    this.code = 'email_exists';
  }
}

export const createAuthError = (message: string, status = 400): Error => {
  return new TestAuthError(message, status);
};

// Consistent test user ID
export const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Default mock responses
const defaultResponses = {
  profile: {
    user_id: TEST_USER_ID,
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    google_id: null,
    updated_at: new Date().toISOString(),
    role: 'user',
    first_name: 'Test',
    last_name: 'User',
    terms_accepted: true,
    stripe_customer_id: null,
    newsletter_subscribed: false
  },
  auth: {
    user: {
      id: TEST_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      raw_user_meta_data: {
        first_name: 'Test',
        last_name: 'User'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
};

// Query builder type for Supabase mock
type MockQueryBuilder = {
  select: jest.Mock<MockQueryBuilder>;
  insert: jest.Mock<MockQueryBuilder>;
  update: jest.Mock<MockQueryBuilder>;
  delete: jest.Mock<MockQueryBuilder>;
  upsert: jest.Mock<MockQueryBuilder>;
  eq: jest.Mock<MockQueryBuilder>;
  neq: jest.Mock<MockQueryBuilder>;
  not: jest.Mock<MockQueryBuilder>;
  single: jest.Mock<Promise<PostgrestSingleResponse<any>>>;
  maybeSingle: jest.Mock<Promise<PostgrestSingleResponse<any>>>; // Added for .maybeSingle()
  then: jest.Mock;
};

// Create a mock query builder for Supabase operations
export const createMockQueryBuilder = (table: string): MockQueryBuilder => {
  console.log('createMockQueryBuilder called for table:', table);
  
  const queryBuilder: MockQueryBuilder = {
    select: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`select called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    insert: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`insert called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    update: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`update called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    delete: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`delete called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    upsert: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`upsert called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    eq: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`eq called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    neq: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`neq called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    not: jest.fn().mockImplementation((...args: any[]) => {
      console.log(`not called for table "${table}" with arguments:`, args);
      return queryBuilder;
    }),
    single: jest.fn().mockImplementation(() => {
      console.log(`single called for table "${table}"`);
      return Promise.resolve({
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<any>);
    }),
    maybeSingle: jest.fn().mockImplementation(() => {
      console.log(`maybeSingle called for table "${table}"`);
      return Promise.resolve({
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<any>);
    }),
    then: jest.fn().mockImplementation((onFulfilled: any) =>
      Promise.resolve({
        data: null,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      } as PostgrestSingleResponse<any>).then(onFulfilled)
    )
  };

  return queryBuilder;
};

// Supabase mock object
export const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn()
    }
  },
  from: jest.fn().mockImplementation((table: string) => {
    console.log(`mockSupabase.from called for table: ${table}`);
    
    const queryBuilder = createMockQueryBuilder(table);

    return {
      ...queryBuilder,
      mockSuccess: (data: any) => {
        console.log('mockSuccess called for table:', table, 'with:', data);
        queryBuilder.single.mockResolvedValueOnce({
          data,
          error: null,
          count: null,
          status: 200,
          statusText: 'OK'
        } as PostgrestSingleResponse<any>);
        return queryBuilder;
      },
      mockError: (message: string) => {
        console.log('mockError called for table:', table, 'with:', message);
        queryBuilder.single.mockResolvedValueOnce({
          data: null,
          error: {
            message,
            code: 'TEST_ERROR',
            details: null,
            hint: null,
            name: 'PostgrestError'
          } as unknown as PostgrestError,
          count: null,
          status: 400,
          statusText: 'Bad Request'
        } as PostgrestSingleResponse<any>);
        return queryBuilder;
      }
    };
  }),
  rpc: jest.fn().mockImplementation((fnName: string, params: any) => {
    console.log(`mockSupabase.rpc called for function: ${fnName} with params:`, params);
    return {
      mockSuccess: (data: any) => {
        console.log('mockSuccess called for RPC:', fnName, 'with:', data);
        return Promise.resolve({ data, error: null });
      },
      mockError: (message: string) => {
        console.log('mockError called for RPC:', fnName, 'with:', message);
        return Promise.resolve({ data: null, error: new Error(message) });
      }
    };
  })
};

// Email service mock
export const mockEmailService = {
  sendNewsletterWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendNewsletterWelcomeBackEmail: jest.fn().mockResolvedValue(true),
  validateEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendSubscriptionConfirmation: jest.fn().mockResolvedValue(true)
};

// Mock external modules
jest.mock('../../services/emailService', () => ({
  emailService: mockEmailService
}));

export const resetMocks = () => {
  console.log('resetMocks: Clearing all mocks...');
  const originalFrom = mockSupabase.from;
  const originalRpc = mockSupabase.rpc;

  jest.clearAllMocks();

  mockSupabase.from = originalFrom;
  mockSupabase.rpc = originalRpc;

  if (mockSupabase.auth.signInWithPassword) {
    mockSupabase.auth.signInWithPassword.mockReset();
  }
  if (mockSupabase.auth.admin.createUser) {
    mockSupabase.auth.admin.createUser.mockReset();
  }
  if (mockSupabase.auth.admin.deleteUser) {
    mockSupabase.auth.admin.deleteUser.mockReset();
  }

  (signToken as jest.Mock).mockReturnValue('test-jwt-token');
  Object.values(mockEmailService).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  const queryBuilder = mockSupabase.from('reset');
  if (queryBuilder) {
    Object.values(queryBuilder).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });
  }
};

// Setup mocks
console.log('=== Setting up Supabase mocks ===');
jest.mock('@supabase/supabase-js', () => {
  console.log('Creating Supabase mock in mocks.ts');
  return {
    createClient: jest.fn(() => mockSupabase)
  };
});

jest.mock('../../services/jwtService', () => ({
  signToken: jest.fn().mockReturnValue('test-jwt-token')
}));