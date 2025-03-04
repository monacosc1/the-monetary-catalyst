import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import { TABLES } from '../../config/tables';

config({ 
  path: path.resolve(__dirname, '../../../.env.test')
});

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

process.env.NODE_ENV = 'test';

export const testSupabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: { schema: 'public' },
    global: { headers: { 'x-my-custom-header': 'my-app-name' } }
  }
);

export const setupTestEnvironment = async () => {
  await Promise.all([
    testSupabase.from(TABLES.USER_PROFILES).delete().not('user_id', 'is', null),
    testSupabase.from(TABLES.NEWSLETTER_USERS).delete().not('id', 'is', null)
  ]);
  await testSupabase.auth.signOut();
};