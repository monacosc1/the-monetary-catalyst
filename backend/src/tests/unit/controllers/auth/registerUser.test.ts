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
  // Capture original implementation properly with type safety
  const originalFromImpl = mockSupabase.from.getMockImplementation() ?? ((table: string) => {
    throw new Error(`Unexpected table access during tests: ${table}`);
  });

  beforeEach(async () => {
    console.log('\n=== Test Setup Starting ===');
    
    // First reset mocks and restore original implementation
    resetMocks();
    mockSupabase.from.mockImplementation(originalFromImpl);

    // Validate query builder before cleanup
    const qb = mockSupabase.from(TABLES.USER_PROFILES);
    console.log('Query builder before cleanup:', {
      isQueryBuilderDefined: !!qb,
      hasDelete: !!qb?.delete,
      hasNot: !!qb?.not,
      methods: qb ? Object.keys(qb) : 'undefined',
      mockState: {
        isJestMock: jest.isMockFunction(mockSupabase.from),
        implementation: typeof mockSupabase.from.getMockImplementation()
      }
    });

    // Now clean tables with restored implementation
    await databaseHelper.cleanTables();
    
    console.log('=== Test Setup Complete ===');
  });

  afterEach(() => {
    console.log('\n=== Test Cleanup Starting ===');
    
    // Reset and properly restore original implementation
    mockSupabase.from.mockReset();
    mockSupabase.from.mockImplementation(originalFromImpl);
    
    // Validate restoration
    const qb = mockSupabase.from(TABLES.USER_PROFILES);
    console.log('Query builder after cleanup:', {
      isQueryBuilderDefined: !!qb,
      hasDelete: !!qb?.delete,
      hasNot: !!qb?.not,
      methods: qb ? Object.keys(qb) : 'undefined',
      mockState: {
        isJestMock: jest.isMockFunction(mockSupabase.from),
        implementation: typeof mockSupabase.from.getMockImplementation()
      }
    });
    
    console.log('=== Test Cleanup Complete ===\n');
  });

  const setupProfileQueryBuilder = (testUser: any, options = { exists: false }) => {
    return {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: options.exists ? {
            user_id: TEST_USER_ID,
            email: testUser.email
          } : null,
          error: null
        })
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
        })
    };
  };

  const setupMockFrom = (testUser: any, options = { exists: false }) => {
    console.log('\n=== Setting up Mock Query Builder ===');
    const qb = setupProfileQueryBuilder(testUser, options);
    console.log('Custom query builder:', {
      methods: Object.keys(qb),
      hasDelete: !!qb.delete,
      hasNot: !!qb.not,
      isMockFunction: jest.isMockFunction(qb.delete)
    });

    mockSupabase.from.mockImplementation((table: string) => {
      console.log(`Query builder requested for table: ${table}`);
      if (table === TABLES.USER_PROFILES) {
        console.log('Returning profile-specific query builder');
        return qb;
      }
      console.log('Using original query builder');
      // Use the captured implementation which we know is defined
      return originalFromImpl(table);
    });
  };

  it('should successfully register a new user', async () => {
    const testUser = {
      ...userFixtures.validUser,
      email: `test${Date.now()}@example.com`
    };

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

    setupMockFrom(testUser);

    const mockReq = mockHelper.createMockRequest({
      body: {
        email: testUser.email,
        password: testUser.password,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        termsAccepted: testUser.termsAccepted
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

    mockSupabase.auth.admin.createUser.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'User already registered',
        status: 400,
        name: 'AuthApiError',
        code: 'email_exists'
      }
    });

    setupMockFrom(testUser, { exists: true });

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