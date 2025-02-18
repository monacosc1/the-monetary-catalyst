import { loginUser } from '../../../../controllers/authController';
import { mockHelper, mockSupabase, resetMocks, TEST_USER_ID } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import { userFixtures } from '../../../fixtures/users';
import { TABLES } from '../../../../config/tables';

describe('Auth Controller - Login', () => {
  beforeEach(async () => {
    console.log('=== Test Setup Starting ===');
    await databaseHelper.cleanTables();
    resetMocks();
    
    // Add debug logging for mock state after reset
    console.log('Mock state after reset:', {
      hasSignInMock: !!mockSupabase.auth.signInWithPassword.mock,
      mockCalls: mockSupabase.auth.signInWithPassword.mock?.calls?.length
    });
    
    console.log('=== Test Setup Complete ===');
  });

  it('should successfully login user', async () => {
    console.log('\n=== Starting login test ===');
    const testUser = userFixtures.validUser;
    console.log('Test user:', JSON.stringify(testUser, null, 2));

    // Mock successful auth
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
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
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Date.now() + 3600000
        }
      },
      error: null
    });

    const mockReq = mockHelper.createMockRequest({
      body: {
        email: testUser.email,
        password: testUser.password
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    // Add debug logging right before the login call
    console.log('About to call loginUser...');
    await loginUser(mockReq as any, mockRes as any, mockNext);
    console.log('loginUser completed');

    console.log('Response status:', (mockRes.status as jest.Mock).mock.calls[0]);
    console.log('Response json:', JSON.stringify((mockRes.json as jest.Mock).mock.calls[0], null, 2));

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'User logged in successfully',
        user: expect.objectContaining({
          id: TEST_USER_ID,
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name
        }),
        token: expect.any(String)
      })
    );
  });

  it('should return error with invalid credentials', async () => {
    // Mock failed auth
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: {
        message: 'Invalid login credentials',
        status: 401
      }
    });

    const mockReq = mockHelper.createMockRequest({
      body: { 
        email: 'wrong@email.com', 
        password: 'wrongpass' 
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await loginUser(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Invalid credentials'
    });
  });

  it('should handle profile fetch error', async () => {
    const testUser = userFixtures.validUser;

    // Mock successful auth
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: {
          id: 'test-user-id',
          email: testUser.email,
          role: 'authenticated'
        },
        session: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_at: Date.now() + 3600000
        }
      },
      error: null
    });

    // Mock failed profile fetch
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Database error',
          code: 'DB_ERROR'
        }
      })
    };

    mockSupabase.from.mockImplementation((table) => {
      console.log(`from called with table: ${table}`);
      return mockQueryBuilder;
    });

    const mockReq = mockHelper.createMockRequest({
      body: {
        email: testUser.email,
        password: testUser.password
      }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await loginUser(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Error fetching user profile'
    });
  });
}); 