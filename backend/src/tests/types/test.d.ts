declare module '*/setupTestDatabase' {
  export function setupTestDatabase(): Promise<boolean>;
  export function verifyTestEnvironment(): void;
} 