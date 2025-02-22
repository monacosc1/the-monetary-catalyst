import { AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { signToken } from '../../services/jwtService';
import { emailService } from '../../services/emailService';

// Export the type
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

// Combine all mock helpers into one object
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

  createMockNext: (): NextFunction => jest.fn(),

  // Stripe helpers
  stripe: {
    createCheckoutSession: {
      success: {
        id: 'test_session_id',
        url: 'https://checkout.stripe.com/test'
      },
      error: new Error('Stripe checkout creation failed')
    }
  },

  // SendGrid helpers
  sendgrid: {
    sendEmail: {
      success: { statusCode: 202 },
      error: new Error('Email sending failed')
    }
  }
};

// Use SupabaseAuthError if defined; otherwise, fallback to native Error.
const BaseAuthError = typeof SupabaseAuthError !== 'undefined' ? SupabaseAuthError : Error;

// Create a proper AuthError class
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

// Update the helper to use the class
export const createAuthError = (message: string, status = 400): Error => {
  return new TestAuthError(message, status);
};

// At the top, add:
export const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Update defaultResponses
const defaultResponses = {
  profile: {
    user_id: TEST_USER_ID,  // Use consistent UUID
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
      id: TEST_USER_ID,  // Use same UUID
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

// Update the query builder type to include upsert
type MockQueryBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  upsert: jest.Mock;  // Add upsert
  [key: string]: jest.Mock;
};

const createMockQueryBuilder = (table: string) => {
  console.log('Creating mock query builder for table:', table);
  
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

  // Make the chain thenable
  const thenable = {
    then: (onFulfilled: any, onRejected: any) => 
      Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected)
  };

  // Return enhanced query builder with thenable behavior
  return Object.assign(queryBuilder, thenable);
};

// Update the Supabase mock
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
    
    const queryBuilder = createMockQueryBuilder(table);

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

// Update resetMocks to remove the from.mockReset() call
export const resetMocks = () => {
  // Capture the original 'from' implementation
  const originalFrom = mockSupabase.from;

  jest.clearAllMocks();

  // Restore the 'from' implementation
  mockSupabase.from = originalFrom;

  // Reset auth methods
  mockSupabase.auth.signInWithPassword.mockReset();
  mockSupabase.auth.admin.createUser.mockReset();
  mockSupabase.auth.admin.deleteUser.mockReset();

  // Reset JWT and email service mocks
  (signToken as jest.Mock).mockReturnValue('test-jwt-token');
  (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(true);
  (emailService.validateEmail as jest.Mock).mockResolvedValue(true);

  // Reset the query builder methods when recreated
  const queryBuilder = mockSupabase.from('reset');
  if (queryBuilder) {
    Object.values(queryBuilder).forEach(method => {
      if (jest.isMockFunction(method)) {
        method.mockReset();
      }
    });
  }
};

// Add at the top, before other jest.mock calls
console.log('=== Setting up Supabase mocks ===');

jest.mock('@supabase/supabase-js', () => {
  console.log('Creating Supabase mock');
  return {
    createClient: jest.fn(() => mockSupabase)
  };
});

jest.mock('../../services/jwtService', () => ({
  signToken: jest.fn().mockReturnValue('test-jwt-token')
}));

jest.mock('../../services/emailService', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    validateEmail: jest.fn().mockResolvedValue(true)
  }
}));
