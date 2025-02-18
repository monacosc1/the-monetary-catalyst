export const newsletterFixtures = {
  validSubscriber: {
    email: 'newsletter@example.com',
    name: 'Newsletter Subscriber',
    source: 'website'
  },

  validSubscribers: [
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

  invalidSubscribers: {
    missingEmail: {
      name: 'Missing Email',
      source: 'website'
    },
    invalidEmail: {
      email: 'not-an-email',
      name: 'Invalid Email',
      source: 'website'
    },
    missingName: {
      email: 'noname@example.com',
      source: 'website'
    },
    missingSource: {
      email: 'nosource@example.com',
      name: 'No Source'
    }
  }
};

export const generateUniqueNewsletterSubscriber = (prefix = 'newsletter') => ({
  email: `${prefix}_${Date.now()}@example.com`,
  name: `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} Subscriber`,
  source: 'website'
}); 