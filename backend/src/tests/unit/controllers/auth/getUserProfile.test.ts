import { getUserProfile } from '../../../../controllers/authController';
import { mockHelper, mockSupabase, resetMocks, TEST_USER_ID } from '../../../helpers/mocks';
import { databaseHelper } from '../../../helpers/database';
import { TABLES } from '../../../../config/tables';

describe('Auth Controller - Get User Profile', () => {
  beforeEach(async () => {
    console.log('=== Test Setup Starting ===');
    await databaseHelper.cleanTables();
    resetMocks();
    console.log('=== Test Setup Complete ===');
  });

  it('should return user profile when valid token provided', async () => {
    const user = {
      id: TEST_USER_ID,
      email: 'test@example.com'
    };

    const profile = {
      user_id: TEST_USER_ID,
      email: user.email,
      first_name: 'Test',
      last_name: 'User',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      terms_accepted: true,
      newsletter_subscribed: false,
      stripe_customer_id: null,
      google_id: null
    };

    // Mock profile fetch
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: profile,
        error: null
      })
    };

    mockSupabase.from.mockImplementation((table) => {
      console.log(`from called with table: ${table}`);
      expect(table).toBe(TABLES.USER_PROFILES);
      return mockQueryBuilder;
    });

    const mockReq = mockHelper.createMockRequest({
      user: { id: user.id }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await getUserProfile(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      profile: expect.objectContaining(profile)
    });

    // Verify correct table and user_id were used
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', user.id);
  });

  it('should handle missing user in request', async () => {
    const mockReq = mockHelper.createMockRequest({
      user: null
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await getUserProfile(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Unauthorized'
    });
  });

  it('should handle database errors appropriately', async () => {
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
      expect(table).toBe(TABLES.USER_PROFILES);
      return mockQueryBuilder;
    });

    const mockReq = mockHelper.createMockRequest({
      user: { id: TEST_USER_ID }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await getUserProfile(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Error fetching user profile',
      error: 'Database error'
    });
  });

  it('should handle profile not found', async () => {
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    };

    mockSupabase.from.mockImplementation((table) => {
      console.log(`from called with table: ${table}`);
      expect(table).toBe(TABLES.USER_PROFILES);
      return mockQueryBuilder;
    });

    const mockReq = mockHelper.createMockRequest({
      user: { id: TEST_USER_ID }
    });
    const mockRes = mockHelper.createMockResponse();
    const mockNext = mockHelper.createMockNext();

    await getUserProfile(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User profile not found'
    });
  });
}); 