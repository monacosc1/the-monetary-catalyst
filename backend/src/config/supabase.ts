// src/config/supabase.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_API_KEY!;
const supabaseSmtpKey = process.env.SUPABASE_SMTP_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseSmtpKey) {
  throw new Error('Missing Supabase configuration');
}

// Only log in test environment
if (process.env.NODE_ENV === 'test') {
  console.log('=== Initializing Supabase client ===');
  console.log('Is createClient mocked?', (createClient as any).mock ? 'Yes' : 'No');
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-smtp-key': supabaseSmtpKey
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Only log in test environment
if (process.env.NODE_ENV === 'test') {
  console.log('Supabase client created with auth methods:', {
    hasSignInMethod: !!supabase.auth.signInWithPassword,
    isMockFunction: typeof jest !== 'undefined' && jest.isMockFunction(supabase.auth.signInWithPassword)
  });
}

export default supabase;
