export const userFixtures = {
  validUser: {
    email: 'test@example.com',
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
    termsAccepted: true
  },

  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    first_name: 'Admin',
    last_name: 'User',
    termsAccepted: true,
    role: 'admin'
  },

  invalidUsers: {
    missingEmail: {
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User',
      termsAccepted: true
    },
    invalidEmail: {
      email: 'not-an-email',
      password: 'Password123!',
      first_name: 'Test',
      last_name: 'User',
      termsAccepted: true
    },
    weakPassword: {
      email: 'test@example.com',
      password: 'weak',
      first_name: 'Test',
      last_name: 'User',
      termsAccepted: true
    }
  }
};

export const generateUniqueUser = (prefix = 'test') => ({
  email: `${prefix}${Date.now()}@example.com`,
  password: 'Password123!',
  first_name: `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}`,
  last_name: 'User',
  termsAccepted: true
}); 