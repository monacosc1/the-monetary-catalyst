import { testSupabase } from '../config/setup';
import { AuthResponse } from '@supabase/supabase-js';
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
    console.log('Cleaning test tables...');
    await Promise.all([
      testSupabase
        .from(TABLES.USER_PROFILES)
        .delete()
        .not('user_id', 'is', null),
      // ... other table cleanups
    ]);
    console.log('Test tables cleaned');
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
        status,
        stripe_subscription_id: `test_sub_${Date.now()}`,
        stripe_customer_id: `test_cus_${Date.now()}`,
        plan_id: 'test_plan',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 