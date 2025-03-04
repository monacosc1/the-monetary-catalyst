import { Database } from '../types/supabase';

// Extract table names as a type
type TableNames = keyof Database['public']['Tables'];

const getTableNames = () => {
  const isTest = process.env.NODE_ENV === 'test';
  const prefix = isTest ? 'test_' : '';

  return {
    USER_PROFILES: `${prefix}user_profiles` as const satisfies TableNames,
    SUBSCRIPTIONS: `${prefix}subscriptions` as const satisfies TableNames,
    NEWSLETTER_USERS: `${prefix}newsletter_users` as const satisfies TableNames,
    PAYMENTS: `${prefix}payments` as const satisfies TableNames
  };
};

export const TABLES = getTableNames();