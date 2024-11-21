module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false
      },
      timezone: 'America/New_York', // Set EST timezone for database connection
      dateStrings: true,
    },
    settings: {
      timezone: 'America/New_York', // Ensure timezone consistency
    },
    options: {
      ssl: env.bool('DATABASE_SSL', false),
    },
  },
}); 