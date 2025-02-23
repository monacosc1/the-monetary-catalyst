import { subscribeToNewsletter } from '../../../../controllers/newsletterController';
import { mockHelper, mockSupabase, resetMocks, TEST_USER_ID, mockEmailService } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import { TABLES } from '../../../../config/tables';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('Newsletter Controller - Subscribe', () => {
  // Capture original implementation
  const originalFromImpl = mockSupabase.from.getMockImplementation() ?? ((table: string) => {
    throw new Error(`Unexpected table access during tests: ${table}`);
  });

  beforeEach(async () => {
    console.log('\n=== Newsletter Subscribe Test Setup Starting ===');
    console.log('Cleaning test database...');
    await databaseHelper.cleanTables();
    
    console.log('Resetting mocks...');
    resetMocks();
    
    console.log('Setting up query builder...');
    mockSupabase.from.mockImplementation(originalFromImpl);
    console.log('=== Newsletter Subscribe Test Setup Complete ===\n');
  });

  it('should create new subscription for new subscriber', async () => {
    console.log('\n=== Testing New Subscription ===');
    console.log('Setting up test data...');
    
    const testSubscription = {
      email: 'new@example.com',
      name: 'New Subscriber',
      source: 'website'
    };
    console.log('Test subscription data:', testSubscription);

    // Mock newsletter check (no existing subscription)
    console.log('Setting up newsletter mocks...');
    const newsletterMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: {
            id: 1,
            email: testSubscription.email,
            name: testSubscription.name,
            source: testSubscription.source,
            status: 'active',
            subscribed_at: expect.any(String)
          },
          error: null
        })
    };
    console.log('Newsletter mocks configured:', newsletterMocks);

    mockSupabase.from.mockImplementation((table: string) => {
      console.log('Query builder requested for table:', table);
      
      if (table === TABLES.NEWSLETTER_USERS) {
        console.log('Using newsletter-specific query builder');
        return {
          ...originalFromImpl(table),
          ...newsletterMocks
        };
      }

      return originalFromImpl(table);
    });

    const mockReq = mockHelper.createMockRequest({
      body: testSubscription
    });
    const mockRes = mockHelper.createMockResponse();

    console.log('Calling subscribeToNewsletter...');
    await subscribeToNewsletter(mockReq as any, mockRes as any);

    // Log response data
    console.log('Response status calls:', mockRes.status.mock.calls);
    console.log('Response json calls:', mockRes.json.mock.calls);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Successfully subscribed'),
        data: expect.any(Object)
      })
    );

    // Verify newsletter record was created
    expect(newsletterMocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: testSubscription.email,
        name: testSubscription.name,
        source: testSubscription.source,
        status: 'active'
      })
    );

    // Verify welcome email was sent
    expect(mockEmailService.sendNewsletterWelcomeEmail)
      .toHaveBeenCalledWith(testSubscription.email, testSubscription.name);

    console.log('Verifying email service calls:', {
      welcomeEmailCalls: mockEmailService.sendNewsletterWelcomeEmail.mock.calls,
      validateEmailCalls: mockEmailService.validateEmail.mock.calls
    });

    console.log('=== New Subscription Test Complete ===\n');
  });

  it('should handle duplicate subscription', async () => {
    console.log('\n=== Testing Duplicate Subscription ===');
    
    const testUser = {
      email: 'existing@example.com',
      name: 'Existing User',
      source: 'website'
    };

    // Mock existing active subscriber
    const newsletterMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: {
          id: 1,
          email: testUser.email,
          status: 'active'
        },
        error: null
      })
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === TABLES.NEWSLETTER_USERS) {
        return {
          ...originalFromImpl(table),
          ...newsletterMocks
        };
      }
      return originalFromImpl(table);
    });

    const mockReq = mockHelper.createMockRequest({
      body: testUser
    });
    const mockRes = mockHelper.createMockResponse();

    await subscribeToNewsletter(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('already subscribed')
      })
    );
  });

  it('should handle invalid email format', async () => {
    // Mock email validation to fail
    mockEmailService.validateEmail.mockResolvedValueOnce(false);

    const mockReq = mockHelper.createMockRequest({
      body: {
        email: 'invalid-email',
        name: 'Test User',
        source: 'website'
      }
    });
    const mockRes = mockHelper.createMockResponse();

    await subscribeToNewsletter(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('valid email')
      })
    );
  });

  it('should handle missing required fields', async () => {
    const mockReq = mockHelper.createMockRequest({
      body: {
        email: 'test@example.com'
        // Missing name and source
      }
    });
    const mockRes = mockHelper.createMockResponse();

    await subscribeToNewsletter(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('required')
      })
    );
  });

  it('should handle subscription for existing registered user', async () => {
    console.log('\n=== Testing Subscription for Existing User ===');
    
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      source: 'website',
      user_id: TEST_USER_ID
    };
    console.log('Test user data:', testUser);

    // Mock newsletter check (no existing subscription)
    const newsletterMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn()
        // First call: check existing subscription
        .mockResolvedValueOnce({
          data: null,
          error: null
        })
        // Second call: after insert
        .mockResolvedValueOnce({
          data: {
            id: 1,
            email: testUser.email,
            name: testUser.name,
            source: testUser.source,
            status: 'active',
            user_id: TEST_USER_ID,
            subscribed_at: expect.any(String)
          },
          error: null
        })
    };

    // Mock profile check (existing profile)
    const profileMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: {
          user_id: TEST_USER_ID,
          email: testUser.email,
          newsletter_subscribed: false
        },
        error: null
      })
    };

    mockSupabase.from.mockImplementation((table: string) => {
      console.log('Query builder requested for table:', table);
      
      if (table === TABLES.NEWSLETTER_USERS) {
        console.log('Using newsletter-specific query builder');
        return {
          ...originalFromImpl(table),
          ...newsletterMocks
        };
      }
      
      if (table === TABLES.USER_PROFILES) {
        console.log('Using profile-specific query builder');
        return {
          ...originalFromImpl(table),
          ...profileMocks
        };
      }

      return originalFromImpl(table);
    });

    const mockReq = mockHelper.createMockRequest({
      body: testUser
    });
    const mockRes = mockHelper.createMockResponse();

    console.log('Calling subscribeToNewsletter...');
    await subscribeToNewsletter(mockReq as any, mockRes as any);

    // Log response data
    console.log('Response status calls:', mockRes.status.mock.calls);
    console.log('Response json calls:', mockRes.json.mock.calls);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Successfully subscribed'),
        data: expect.any(Object)
      })
    );

    // Verify newsletter record was created with user_id
    expect(newsletterMocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: testUser.email,
        name: testUser.name,
        source: testUser.source,
        status: 'active',
        user_id: TEST_USER_ID
      })
    );

    // Verify profile was updated
    expect(profileMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        newsletter_subscribed: true,
        updated_at: expect.any(String)
      })
    );

    // Verify welcome email was sent
    expect(mockEmailService.sendNewsletterWelcomeEmail)
      .toHaveBeenCalledWith(testUser.email, testUser.name);

    console.log('=== Existing User Subscription Test Complete ===\n');
  });

  it('should reactivate unsubscribed user and update profile', async () => {
    console.log('\n=== Testing Newsletter Reactivation ===');
    
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      source: 'website',
      user_id: TEST_USER_ID
    };
    console.log('Test user data:', testUser);

    // Mock newsletter check (existing unsubscribed user)
    const newsletterMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn()
        // First call: check existing subscription
        .mockResolvedValueOnce({
          data: {
            id: 1,
            email: testUser.email,
            status: 'unsubscribed'
          },
          error: null
        })
        // Second call: after update
        .mockResolvedValueOnce({
          data: {
            id: 1,
            email: testUser.email,
            name: testUser.name,
            source: testUser.source,
            status: 'active',
            user_id: TEST_USER_ID,
            unsubscribed_at: null,
            updated_at: expect.any(String)
          },
          error: null
        })
    };

    // Mock profile check (existing profile)
    const profileMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: {
          user_id: TEST_USER_ID,
          email: testUser.email,
          newsletter_subscribed: false
        },
        error: null
      })
    };

    mockSupabase.from.mockImplementation((table: string) => {
      console.log('Query builder requested for table:', table);
      
      if (table === TABLES.NEWSLETTER_USERS) {
        console.log('Using newsletter-specific query builder');
        return {
          ...originalFromImpl(table),
          ...newsletterMocks
        };
      }
      
      if (table === TABLES.USER_PROFILES) {
        console.log('Using profile-specific query builder');
        return {
          ...originalFromImpl(table),
          ...profileMocks
        };
      }

      return originalFromImpl(table);
    });

    const mockReq = mockHelper.createMockRequest({
      body: testUser
    });
    const mockRes = mockHelper.createMockResponse();

    console.log('Calling subscribeToNewsletter...');
    await subscribeToNewsletter(mockReq as any, mockRes as any);

    // Log response data
    console.log('Response status calls:', mockRes.status.mock.calls);
    console.log('Response json calls:', mockRes.json.mock.calls);

    // Verify response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.stringContaining('Welcome back'),
        data: expect.any(Object)
      })
    );

    // Verify newsletter record was updated
    expect(newsletterMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        name: testUser.name,
        source: testUser.source,
        updated_at: expect.any(String),
        unsubscribed_at: null,
        user_id: TEST_USER_ID
      })
    );

    // Verify welcome-back email was sent
    expect(mockEmailService.sendNewsletterWelcomeBackEmail)
      .toHaveBeenCalledWith(testUser.email, testUser.name);

    console.log('=== Newsletter Reactivation Test Complete ===\n');
  });

  it('should handle database errors when checking user profile', async () => {
    console.log('\n=== Testing Database Error ===');
    
    const testUser = {
      email: 'test@example.com',
      name: 'Test User',
      source: 'website'
    };

    // Create error object
    const dbError = {
      message: 'Database error',
      code: 'DB_ERROR'
    };

    // Mock database error with logging
    const profileMocks = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValueOnce({
        data: null,
        error: dbError
      })
    };

    mockSupabase.from.mockImplementation((table: string) => {
      console.log(`Query builder requested for table: ${table}`);
      
      if (table === TABLES.USER_PROFILES) {
        console.log('Configuring error mock for USER_PROFILES');
        console.log('Expected error:', dbError);
        
        return {
          ...originalFromImpl(table),
          ...profileMocks
        };
      }
      return originalFromImpl(table);
    });

    const mockReq = mockHelper.createMockRequest({
      body: testUser
    });
    const mockRes = mockHelper.createMockResponse();

    // Log the mock chain before calling the controller
    console.log('Profile mock chain:', {
      select: profileMocks.select.mock?.calls || [],
      eq: profileMocks.eq.mock?.calls || [],
      single: profileMocks.single.mock?.calls || []
    });

    await subscribeToNewsletter(mockReq as any, mockRes as any);

    // Log the actual calls after controller execution
    console.log('Profile mock calls after execution:', {
      select: profileMocks.select.mock?.calls || [],
      eq: profileMocks.eq.mock?.calls || [],
      single: profileMocks.single.mock?.calls || [],
      response: mockRes.status.mock.calls
    });

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Failed to process')
      })
    );
  });

  afterEach(() => {
    console.log('\n=== Newsletter Subscribe Test Cleanup Starting ===');
    console.log('Email service calls:', {
      welcome: mockEmailService.sendNewsletterWelcomeEmail.mock.calls,
      welcomeBack: mockEmailService.sendNewsletterWelcomeBackEmail.mock.calls,
      validate: mockEmailService.validateEmail.mock.calls
    });
    console.log('=== Newsletter Subscribe Test Cleanup Complete ===\n');
  });
}); 