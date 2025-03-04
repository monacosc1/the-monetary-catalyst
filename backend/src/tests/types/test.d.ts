/// <reference types="jest" />
/// <reference types="node" />

declare module '*/setupTestDatabase' {
  export function setupTestDatabase(): Promise<boolean>;
  export function verifyTestEnvironment(): void;
} 