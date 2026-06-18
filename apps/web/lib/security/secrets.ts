/**
 * Secrets Management Abstraction Layer
 * 
 * Centralized utility to securely fetch environment secrets.
 * This abstraction enables future migration to a secure Vault system
 * (e.g., AWS Secrets Manager, HashiCorp Vault) without refactoring all API routes.
 */

export function getSecret(key: string, required: boolean = false): string | undefined {
  const secret = process.env[key];
  
  if (required && !secret) {
    throw new Error(`CRITICAL: Required secret '${key}' is missing from the environment.`);
  }

  return secret;
}

export function requireSecret(key: string): string {
  return getSecret(key, true) as string;
}
