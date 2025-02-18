const getTableNames = () => {
  const isTest = process.env.NODE_ENV === 'test';
  const prefix = isTest ? 'test_' : '';

  return {
    USER_PROFILES: `${prefix}user_profiles`,
    SUBSCRIPTIONS: `${prefix}subscriptions`,
    NEWSLETTER_USERS: `${prefix}newsletter_users`,
    PAYMENTS: `${prefix}payments`
  };
};

export const TABLES = getTableNames(); 