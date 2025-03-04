import { testSupabase } from '../config/setup';
import { databaseHelper } from './database';

export const authHelper = {
  /**
   * Get authentication token for test user
   */
  async getTestUserToken(email: string, password: string) {
    const { data, error } = await testSupabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data.session?.access_token;
  },

  /**
   * Create and authenticate test user
   */
  async createAuthenticatedUser(userData = {
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User'
  }) {
    const { user, profile } = await databaseHelper.createTestUser(userData); // Fix: 'user', not 'authUser'
  
    const token = await this.getTestUserToken(userData.email, userData.password);
  
    return {
      user,  // Fix: 'user', not 'authUser.user'
      profile,
      token
    };
  }
}; 