/** Maximum rows returned from any user query */
export const MAX_ROWS = 1000;

/** Maximum response payload size in bytes (5MB) */
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

/** Statement timeout in milliseconds */
export const STATEMENT_TIMEOUT_MS = 10_000;

export interface SqlValidationResult {
  isValid: boolean;
  error?: string;
  /** The sanitized SQL with LIMIT enforced (if valid) */
  sanitizedSql?: string;
}

/**
 * Blocked schema/system table references.
 * Prevents information disclosure via metadata queries.
 */
const BLOCKED_SCHEMAS = [
  'pg_stat_activity',
  'pg_roles',
  'pg_authid',
  'pg_shadow',
  'pg_user',
  'information_schema', // We shouldn't let them query schema internals directly
];

/**
 * Validates a SQL query using Regex.
 * Enforces:
 * - Only SELECT statements allowed
 * - Blocked schema references rejected
 * - LIMIT auto-appended
 */
export function validateSqlQuery(sql: string, engine?: 'postgresql' | 'mysql' | 'mssql' | 'mongodb'): SqlValidationResult {
  const trimmedSql = sql.trim();

  if (!trimmedSql) {
    return { isValid: false, error: 'Query cannot be empty.' };
  }

  const upperQuery = trimmedSql.toUpperCase();
  
  // Must start with SELECT or WITH
  if (!upperQuery.startsWith('SELECT') && !upperQuery.startsWith('WITH')) {
    return { isValid: false, error: 'Only SELECT queries are allowed.' };
  }

  // Block mutating keywords
  const blockedKeywords = ['INSERT ', 'UPDATE ', 'DELETE ', 'DROP ', 'ALTER ', 'CREATE ', 'TRUNCATE ', 'REPLACE ', 'GRANT ', 'REVOKE ', 'EXECUTE ', 'CALL '];
  for (const keyword of blockedKeywords) {
    if (upperQuery.includes(keyword)) {
      return { isValid: false, error: `${keyword.trim()} statements are not allowed.` };
    }
  }

  // Block system schemas
  const lowerQuery = trimmedSql.toLowerCase();
  for (const blocked of BLOCKED_SCHEMAS) {
    if (lowerQuery.includes(blocked)) {
      return { isValid: false, error: `Access to system table '${blocked}' is not allowed.` };
    }
  }

  let sanitizedSql = trimmedSql;
  
  // Append LIMIT if not present (simple regex fallback)
  if (!upperQuery.includes('LIMIT') && !upperQuery.includes('TOP')) {
    if (engine === 'mssql') {
      // Very naive TOP insertion for MSSQL
      sanitizedSql = sanitizedSql.replace(/^SELECT /i, `SELECT TOP ${MAX_ROWS} `);
    } else {
      // PostgreSQL / MySQL
      sanitizedSql = sanitizedSql.replace(/;+$/, '');
      sanitizedSql = `${sanitizedSql}\nLIMIT ${MAX_ROWS}`;
    }
  }

  return { isValid: true, sanitizedSql };
}

/**
 * Checks if a response payload exceeds the maximum allowed size.
 */
export function checkPayloadSize(data: any): { withinLimit: boolean; sizeBytes: number } {
  const json = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(json, 'utf8');
  return { withinLimit: sizeBytes <= MAX_PAYLOAD_BYTES, sizeBytes };
}
