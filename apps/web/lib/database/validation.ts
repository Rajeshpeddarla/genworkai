export function validateSqlQuery(sql: string): { isValid: boolean; error?: string } {
  const normalizedSql = sql.trim().toLowerCase();
  
  // Basic Regex for checking allowed statements
  // We only allow SELECT statements
  if (!normalizedSql.startsWith('select')) {
    return { isValid: false, error: 'Only SELECT queries are allowed.' };
  }

  // List of blocked keywords
  const blockedKeywords = [
    'insert ', 'update ', 'delete ', 'drop ', 'alter ', 'truncate ',
    'create ', 'replace ', 'grant ', 'revoke ', 'commit ', 'rollback ',
    'call ', 'execute '
  ];

  for (const keyword of blockedKeywords) {
    // We check using a regex to ensure word boundaries to avoid false positives (e.g. if a column is named "update_date")
    // Note: A more robust SQL parser is recommended for production.
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalizedSql)) {
      return { isValid: false, error: `The keyword '${keyword.trim()}' is not allowed.` };
    }
  }

  return { isValid: true };
}
