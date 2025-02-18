import { testSupabase } from './setup';
import { TABLES } from '../../config/tables';

// Global test teardown
export default async (): Promise<void> => {
  try {
    // First get all test users to ensure we clean up their profiles
    const { data: { users } = { users: [] } } = await testSupabase.auth.admin.listUsers();
    const testUserIds = users
      .filter(u => u.email?.includes('test@') || u.email?.includes('example.com'))
      .map(u => u.id);

    // Delete test profiles first (due to potential foreign key constraints)
    await testSupabase
      .from(TABLES.USER_PROFILES)
      .delete()
      .in('user_id', testUserIds);

    // Then delete the auth users
    await Promise.all(
      testUserIds.map(id => testSupabase.auth.admin.deleteUser(id))
    );

    // Clean up any orphaned test profiles
    await testSupabase
      .from(TABLES.USER_PROFILES)
      .delete()
      .or(`email.like.%test@%,email.like.%example.com%`);

    // Clean other test tables
    await Promise.all([
      testSupabase.from(TABLES.NEWSLETTER_USERS).delete(),
      testSupabase.from(TABLES.SUBSCRIPTIONS).delete(),
      testSupabase.from(TABLES.PAYMENTS).delete()
    ]);

    console.log('Test cleanup completed - All test tables cleaned');
  } catch (error) {
    console.error('Error during test cleanup:', error);
    throw error;
  } finally {
    // Always try to sign out, even if cleanup fails
    try {
      await testSupabase.auth.signOut();
      console.log('Test user signed out');
    } catch (signOutError) {
      console.error('Error signing out test user:', signOutError);
    }
  }
}; 