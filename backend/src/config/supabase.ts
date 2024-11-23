// src/config/supabase.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabaseSmtpKey = process.env.SUPABASE_SMTP_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseSmtpKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-smtp-key': supabaseSmtpKey
    }
  }
});

export default supabase;
