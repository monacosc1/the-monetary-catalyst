module.exports = {
  // Use the ts-jest preset for JS+TS ESM support
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/config/setup.ts'],
  globalTeardown: '<rootDir>/src/tests/config/teardown.ts',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['**/*.test.ts'],
  verbose: true,
  forceExit: true,
  // Transform both .ts and .js files using ts-jest with ESM enabled
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      useESM: true,
      isolatedModules: true
    }]
  },
  // Update transformIgnorePatterns to ensure modules like p-retry, stripe, @supabase/supabase-js, and is-network-error are transformed
  transformIgnorePatterns: [
    '/node_modules/(?!(p-retry|stripe|@supabase/supabase-js|is-network-error)/)'
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'json', 'node'],
  // Only treat .ts and .tsx files as ESM; .js files are handled automatically.
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironmentOptions: {
    nodeOptions: {
      experimentalVmModules: true
    }
  }
};
