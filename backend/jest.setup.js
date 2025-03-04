console.log('=== Running Jest Setup ===');

// Mock the Supabase client in global setup
jest.mock('@supabase/supabase-js', () => {
  console.log('Setting up Supabase mock in global setup');
  return {
    createClient: jest.fn(() => require('./src/tests/helpers/mocks').mockSupabase)
  };
});

// Mock Stripe globally with direct method mocks
jest.mock('stripe', () => {
  console.log('Setting up Stripe mock in global setup');
  const { createStripeMock } = require('./src/tests/helpers/stripeMock');
  const stripeInstance = createStripeMock();
  console.log('Stripe mock instance created:', {
    hasCheckout: !!stripeInstance.checkout,
    hasSessionsCreate: !!stripeInstance.checkout?.sessions?.create,
    hasCustomersCreate: !!stripeInstance.customers?.create
  });
  return {
    __esModule: true,
    default: jest.fn(() => stripeInstance),
    ...stripeInstance
  };
});

console.log('=== Jest Setup Complete ===');
console.log('Current Node.js version:', process.version);
console.log('Current process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('TransformIgnorePatterns:', module.exports.transformIgnorePatterns || 'Not available');