export const subscriptionFixtures = {
  validSubscription: {
    email: 'subscriber@example.com',
    name: 'Test Subscriber',
    source: 'website'
  },

  validSubscriptions: [
    {
      email: 'subscriber1@example.com',
      name: 'Test Subscriber 1',
      source: 'website'
    },
    {
      email: 'subscriber2@example.com',
      name: 'Test Subscriber 2',
      source: 'landing_page'
    }
  ],

  invalidSubscriptions: {
    missingEmail: {
      name: 'Missing Email User',
      source: 'website'
    },
    invalidEmail: {
      email: 'not-an-email',
      name: 'Invalid Email User',
      source: 'website'
    },
    missingName: {
      email: 'noname@example.com',
      source: 'website'
    }
  }
};

export const generateUniqueSubscriber = (prefix = 'subscriber') => ({
  email: `${prefix}${Date.now()}@example.com`,
  name: `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} User`,
  source: 'website'
}); 