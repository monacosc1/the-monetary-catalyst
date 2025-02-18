import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { TABLES } from '../../config/tables';

// Add debugging
console.log('Current directory:', __dirname);
console.log('Env file path:', path.resolve(__dirname, '../../../.env.test'));

// Load test environment variables
config({ 
  path: path.resolve(__dirname, '../../../.env.test')
});

// Debug environment variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Ensure we're in test environment
process.env.NODE_ENV = 'test';

// Initialize test Supabase client
export const testSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-my-custom-header': 'my-app-name'
      }
    }
  }
);

// Add setup function to ensure clean state
export const setupTestEnvironment = async () => {
  // Clean existing data first
  await Promise.all([
    testSupabase
      .from(TABLES.USER_PROFILES)
      .delete()
      .not('id', 'is', null),

    testSupabase
      .from(TABLES.NEWSLETTER_USERS)
      .delete()
      .not('id', 'is', null)
  ]);

  // Ensure we're signed out
  await testSupabase.auth.signOut();
};

// Remove or fix the beforeAll usage
// global.beforeAll is not available in this context 