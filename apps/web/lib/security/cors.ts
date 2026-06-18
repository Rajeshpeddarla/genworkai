/**
 * Dynamic CORS Header Generator
 * 
 * Secures routes against unauthorized cross-origin requests by enforcing
 * an allowlist from the ALLOWED_ORIGINS environment variable.
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  
  const corsOrigin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin) 
    ? requestOrigin 
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': corsOrigin || '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Allow-Credentials': 'true'
  };
}
