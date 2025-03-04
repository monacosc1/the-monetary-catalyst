import { testSupabase } from '../config/setup';
import { Database } from '../../types/supabase'; // Added import
import { TABLES } from '../../config/tables';

export const databaseHelper = {
  /**
   * Verify test environment
   */
  verifyTestEnvironment() {
    // Only verify we're in test environment, remove schema check
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Must run in test environment');
    }
  },

  /**
   * Clean test database tables
   */
  async cleanTables() {
    console.log('\n=== Database Cleanup Starting ===');
    
    this.verifyTestEnvironment();
  
    try {
      const { error } = await testSupabase
        .from(TABLES.USER_PROFILES)
        .delete()
        .not('user_id', 'is', null); // Valid syntax, but needs proper typing
  
      if (error) {
        console.error('Error cleaning USER_PROFILES:', error);
        throw error;
      }
  
      console.log('Successfully cleaned USER_PROFILES');
      console.log('All tables cleaned successfully');
    } catch (error) {
      console.error('Error during table cleanup:', {
        error,
        stack: (error as Error).stack,
        type: typeof error
      });
      throw error;
    }
  
    console.log('=== Database Cleanup Complete ===\n');
  },

  /**
   * Setup test database - can be used in beforeAll or beforeEach
   */
  async setupTestDatabase() {
    this.verifyTestEnvironment();
    await this.cleanTables();
    // Add any additional setup or seed data here
    return true;
  },

  /**
   * Create test user
   */
  async createTestUser(userData: any) {
    const { data: authData, error: authError } = await testSupabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) throw authError;

    const { data: profile, error: profileError } = await testSupabase
      .from(TABLES.USER_PROFILES)
      .upsert({
        user_id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: 'user',
        terms_accepted: true,
        newsletter_subscribed: false
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return { user: authData.user, profile };
  },

  /**
   * Create test subscription
   */
  async createTestSubscription(userId: string, status: 'active' | 'inactive' = 'active') {
    this.verifyTestEnvironment();
  
    const { data, error } = await testSupabase
      .from(TABLES.SUBSCRIPTIONS)
      .upsert({
        user_id: userId,
        status: status as Database["public"]["Enums"]["subscription_status_enum"], // Explicit type
        stripe_subscription_id: `test_sub_${Date.now()}`,
        plan_type: 'monthly' as Database["public"]["Enums"]["plan_type_enum"], // Replace plan_id, use enum
        start_date: new Date().toISOString(), // Required field
        created_at: new Date().toISOString(), // Optional but good for tests
        updated_at: new Date().toISOString(), // Optional but good for tests
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Renamed from current_period_end
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
  
    if (error) throw error;
    return data;
  }
}; 