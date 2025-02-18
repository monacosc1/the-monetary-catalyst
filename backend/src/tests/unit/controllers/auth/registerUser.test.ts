import { registerUser } from '../../../../controllers/authController';
import { mockHelper, mockSupabase, resetMocks, TEST_USER_ID } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import { emailService } from '../../../../services/emailService';
import { userFixtures, generateUniqueUser } from '../../../fixtures/users';
import { TABLES } from '../../../../config/tables';

// Mock email service
jest.mock('../../../../services/emailService', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    validateEmail: jest.fn().mockResolvedValue(true)
  }
}));

describe('Auth Controller - Register User', () => {
  beforeEach(async () => {
    console.log('=== Test Setup Starting ===');
    await databaseHelper.cleanTables();
    resetMocks();
    console.log('=== Test Setup Complete ===');
  });

  it('should successfully register a new user', async () => {
    const testUser = generateUniqueUser();
    console.log('Test user:', JSON.stringify(testUser, null, 2));

    // Mock auth user creation
    mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
      data: {
        user: {
          id: TEST_USER_ID,
          email: testUser.email,
          role: 'authenticated',
          aud: 'authenticated',
          user_metadata: {
            first_name: testUser.first_name,
            last_name: testUser.last_name
          }
        }
      },
      error: null
    });

    // Mock profile check (not found)
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn()
        // First call (check) returns no profile
        .mockResolvedValueOnce({ data: null, error: null })
        // Second call (create) returns new profile
        .mockResolvedValueOnce({
          data: {
            user_id: TEST_USER_ID,
            email: testUser.email,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            role: 'user',
            terms_accepted: true,
            newsletter_subscribed: false
          },
          error: null
        }),
    };

    mockSupabase.from.mockImplementation(() => mockQueryBuilder);

    const mockReq = mockHelper.createMockRequest({
      body: {
        ...testUser,
        termsAccepted: true
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await registerUser(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User registered successfully',
        user: expect.objectContaining({
          id: TEST_USER_ID,
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name
        })
      })
    );
  });

  it('should handle duplicate email registration', async () => {
    const testUser = userFixtures.validUser;

    // Mock auth error for duplicate email
    mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'User already registered',
        status: 400,
        name: 'AuthApiError',
        code: 'email_exists'
      }
    });

    const mockReq = mockHelper.createMockRequest({
      body: {
        ...testUser,
        termsAccepted: true
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await registerUser(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User already registered'
    });
  });

  it('should return error if terms not accepted', async () => {
    const mockReq = mockHelper.createMockRequest({
      body: {
        ...userFixtures.validUser,
        termsAccepted: false
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await registerUser(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: expect.stringContaining('Terms & Conditions')
    });
  });

  it('should validate email format', async () => {
    // Mock email validation to fail
    (emailService.validateEmail as jest.Mock).mockResolvedValueOnce(false);

    const mockReq = mockHelper.createMockRequest({
      body: {
        ...userFixtures.validUser,
        email: 'invalid-email',
        termsAccepted: true
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await registerUser(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('valid email')
    });
  });
}); 