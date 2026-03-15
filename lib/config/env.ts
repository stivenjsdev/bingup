/**
 * Validates and exposes required environment variables.
 * Fails fast at startup if any required variable is missing.
 */

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getEnv() {
  return {
    MONGODB_URI: requiredEnv("MONGODB_URI"),
    NODE_ENV: process.env.NODE_ENV ?? "development",
  } as const;
}
