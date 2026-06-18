import { Parser } from 'node-sql-parser';

// ─── SQL Query Sandbox ─────────────────────────────────────────────────────────

const parser = new Parser();

/** Maximum rows returned from any user query */
export const MAX_ROWS = 1000;

/** Maximum response payload size in bytes (5MB) */
export const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

/** Statement timeout in milliseconds */
export const STATEMENT_TIMEOUT_MS = 10_000;

/**
 * Blocked SQL statement types.
 * Only SELECT is allowed — everything else is rejected at the AST level.
 */
const BLOCKED_STATEMENT_TYPES = new Set([
  'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate',
  'replace', 'grant', 'revoke', 'commit', 'rollback',
  'explain', 'analyze', 'copy', 'call', 'execute', 'prepare',
]);

/**
 * Blocked schema/system table references.
 * Prevents information disclosure via metadata queries.
 */
const BLOCKED_SCHEMAS = [
  'pg_catalog',
  'information_schema',
  'pg_stat_activity',
  'pg_roles',
  'pg_authid',
  'pg_shadow',
  'pg_user',
  'pg_tables',
  'pg_views',
];

export interface SqlValidationResult {
  isValid: boolean;
  error?: string;
  /** The sanitized SQL with LIMIT enforced (if valid) */
  sanitizedSql?: string;
}

/**
 * Validates a SQL query using AST parsing.
 * 
 * Enforces:
 * - Only single SELECT statements allowed
 * - Blocked statement types rejected (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE,
 *   TRUNCATE, EXPLAIN, ANALYZE, COPY, CALL, EXECUTE, PREPARE, GRANT, REVOKE)
 * - Blocked schema references rejected (pg_catalog, information_schema, pg_stat_activity,
 *   pg_roles, pg_authid)
 * - LIMIT 1000 auto-appended if no LIMIT specified
 * - 10-second statement timeout enforced at execution
 * - 5MB maximum response payload size
 */
export function validateSqlQuery(sql: string): SqlValidationResult {
  const trimmedSql = sql.trim();

  if (!trimmedSql) {
    return { isValid: false, error: 'Query cannot be empty.' };
  }

  // Reject multiple statements (semicolons)
  const statementCount = trimmedSql.split(';').filter(s => s.trim().length > 0).length;
  if (statementCount > 1) {
    return { isValid: false, error: 'Multiple SQL statements are not allowed.' };
  }

  // Parse the AST
  let ast: any;
  try {
    ast = parser.astify(trimmedSql, { database: 'PostgreSQL' });
  } catch (parseError: any) {
    return { isValid: false, error: 'Invalid SQL syntax.' };
  }

  // Handle array result (multiple statements)
  const statements = Array.isArray(ast) ? ast : [ast];

  if (statements.length > 1) {
    return { isValid: false, error: 'Multiple SQL statements are not allowed.' };
  }

  const stmt = statements[0];
  if (!stmt) {
    return { isValid: false, error: 'Invalid SQL: no statement found.' };
  }

  // Check statement type
  const stmtType = (stmt.type || '').toLowerCase();
  if (stmtType !== 'select') {
    if (BLOCKED_STATEMENT_TYPES.has(stmtType)) {
      return { isValid: false, error: `${stmtType.toUpperCase()} statements are not allowed. Only SELECT is permitted.` };
    }
    return { isValid: false, error: `Statement type '${stmtType}' is not allowed. Only SELECT is permitted.` };
  }

  // Deep check the AST for blocked schema references
  const blockedRef = findBlockedSchemaReference(stmt);
  if (blockedRef) {
    return { isValid: false, error: `Access to system table '${blockedRef}' is not allowed.` };
  }

  // Enforce LIMIT
  let sanitizedSql = trimmedSql;
  if (!hasLimit(stmt)) {
    // Remove trailing semicolon if present, append LIMIT
    sanitizedSql = sanitizedSql.replace(/;\s*$/, '');
    sanitizedSql = `${sanitizedSql} LIMIT ${MAX_ROWS}`;
  } else {
    // If LIMIT exists but exceeds MAX_ROWS, clamp it
    const existingLimit = getLimit(stmt);
    if (existingLimit !== null && existingLimit > MAX_ROWS) {
      // Replace the limit value in the AST and regenerate
      sanitizedSql = sanitizedSql.replace(
        /LIMIT\s+\d+/i,
        `LIMIT ${MAX_ROWS}`
      );
    }
  }

  return { isValid: true, sanitizedSql };
}

/**
 * Recursively walks the AST to find references to blocked schemas.
 */
function findBlockedSchemaReference(node: any): string | null {
  if (!node || typeof node !== 'object') return null;

  // Check table references
  if (node.table) {
    const tableName = typeof node.table === 'string' ? node.table.toLowerCase() : '';
    const schemaName = typeof node.schema === 'string' ? node.schema.toLowerCase() : '';
    const dbName = typeof node.db === 'string' ? node.db.toLowerCase() : '';

    for (const blocked of BLOCKED_SCHEMAS) {
      if (tableName === blocked || schemaName === blocked || dbName === blocked) {
        return blocked;
      }
    }
  }

  // Recurse into arrays
  if (Array.isArray(node)) {
    for (const item of node) {
      const result = findBlockedSchemaReference(item);
      if (result) return result;
    }
  }

  // Recurse into object properties
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue; // Avoid circular refs
    const result = findBlockedSchemaReference(node[key]);
    if (result) return result;
  }

  return null;
}

/**
 * Checks if a SELECT AST node has a LIMIT clause.
 */
function hasLimit(stmt: any): boolean {
  return stmt.limit !== null && stmt.limit !== undefined;
}

/**
 * Extracts the numeric LIMIT value from a SELECT AST node.
 */
function getLimit(stmt: any): number | null {
  if (!stmt.limit) return null;
  const limitVal = stmt.limit.value;
  if (Array.isArray(limitVal) && limitVal.length > 0) {
    return typeof limitVal[0]?.value === 'number' ? limitVal[0].value : null;
  }
  return typeof limitVal === 'number' ? limitVal : null;
}

/**
 * Checks if a response payload exceeds the maximum allowed size.
 */
export function checkPayloadSize(data: any): { withinLimit: boolean; sizeBytes: number } {
  const json = JSON.stringify(data);
  const sizeBytes = Buffer.byteLength(json, 'utf8');
  return { withinLimit: sizeBytes <= MAX_PAYLOAD_BYTES, sizeBytes };
}
