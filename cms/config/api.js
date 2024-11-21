module.exports = {
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
  responses: {
    timezone: 'America/New_York',
  },
  settings: {
    parser: {
      timestamp: {
        timezone: 'America/New_York',
      },
    },
  },
}; 