import { subscribeToNewsletter } from '../../../../controllers/newsletterController';
import { mockHelper, mockSupabase, resetMocks } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import { emailService } from '../../../../services/emailService';

// Mock email service
jest.mock('../../../../services/emailService', () => ({
  emailService: {
    sendNewsletterWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendNewsletterWelcomeBackEmail: jest.fn().mockResolvedValue(true),
    validateEmail: jest.fn().mockResolvedValue(true)
  }
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('Newsletter Controller - Subscribe', () => {
  beforeEach(async () => {
    await databaseHelper.cleanTables();
    resetMocks();
  });

  it('should subscribe new user to newsletter', async () => {
    const testSubscription = {
      email: 'test@example.com',
      name: 'Test User',
      source: 'website'
    };

    // Mock that subscriber doesn't exist
    mockSupabase.from('test_newsletter_users')
      .mockSuccess(null);  // First check returns no existing subscriber

    // Mock successful subscription
    mockSupabase.from('test_newsletter_users')
      .mockSuccess({
        id: 1,
        email: testSubscription.email,
        name: testSubscription.name,
        source: testSubscription.source,
        status: 'active',
        subscribed_at: expect.any(String)
      });

    const mockReq = mockHelper.createMockRequest({
      body: testSubscription
    });
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

  it('should handle duplicate subscription', async () => {
    const existingSubscriber = {
      id: 1,
      email: 'existing@example.com',
      name: 'Existing User',
      status: 'active'
    };

    // Mock existing active subscriber
    mockSupabase.from('test_newsletter_users')
      .mockSuccess(existingSubscriber);

    const mockReq = mockHelper.createMockRequest({
      body: {
        email: existingSubscriber.email,
        name: existingSubscriber.name,
        source: 'website'
      }
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
    (emailService.validateEmail as jest.Mock).mockResolvedValueOnce(false);

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
}); 