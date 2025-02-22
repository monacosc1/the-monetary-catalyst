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
    console.log('\n=== Database Cleanup Starting ===');
    
    // Log query builder state before cleanup
    const qb = testSupabase.from(TABLES.USER_PROFILES);
    console.log('Initial query builder:', {
      isQueryBuilderDefined: !!qb,
      hasDelete: !!qb?.delete,
      hasNot: !!qb?.not,
      methods: qb ? Object.keys(qb) : 'undefined',
      hasThenable: typeof qb?.then === 'function'
    });

    try {
      console.log('Attempting to clean tables...');
      
      // Create and inspect the cleanup chain
      const cleanupChain = testSupabase
        .from(TABLES.USER_PROFILES)
        .delete()
        .not('user_id', 'is', null);
        
      console.log('Cleanup chain details:', {
        type: typeof cleanupChain,
        isPromise: cleanupChain instanceof Promise,
        hasThenable: typeof cleanupChain?.then === 'function',
        methods: Object.keys(cleanupChain),
        deleteReturnType: typeof cleanupChain?.delete?.(),
        notReturnType: typeof cleanupChain?.not?.(),
        thenType: typeof cleanupChain?.then
      });

      await Promise.all([
        Promise.resolve(cleanupChain)
          .then((result) => {
            console.log('Cleanup chain resolved with:', result);
            console.log('Successfully cleaned USER_PROFILES');
          })
          .catch((err: any) => {
            console.error('Error cleaning USER_PROFILES:', {
              error: err,
              stack: err.stack,
              chainState: {
                hasDelete: !!cleanupChain?.delete,
                deleteReturnType: typeof cleanupChain?.delete?.(),
                notReturnType: typeof cleanupChain?.not?.(),
                thenType: typeof cleanupChain?.then
              }
            });
          }),
        // ... other table cleanups
      ]);
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