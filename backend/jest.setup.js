console.log('=== Running Jest Setup ===');

jest.mock('@supabase/supabase-js', () => {
  console.log('Setting up Supabase mock in global setup');
  return {
    createClient: jest.fn(() => require('./src/tests/helpers/mocks').mockSupabase)
  };
});

console.log('=== Jest Setup Complete ==='); 