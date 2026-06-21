import dns from 'dns/promises';

// ─── SSRF Protection ───────────────────────────────────────────────────────────

/**
 * Blocked IP ranges for SSRF protection.
 * Prevents server-side requests to internal/private/cloud metadata addresses.
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                     // Loopback (127.0.0.0/8)
  /^10\./,                      // Private Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[01])\./, // Private Class B (172.16.0.0/12)
  /^192\.168\./,                // Private Class C (192.168.0.0/16)
  /^169\.254\./,                // Link-local (169.254.0.0/16)
  /^0\./,                       // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Shared address space (100.64.0.0/10)
  /^::1$/,                      // IPv6 loopback
  /^fc00:/i,                    // IPv6 unique local
  /^fe80:/i,                    // IPv6 link-local
  /^fd/i,                       // IPv6 ULA
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.internal',
  '169.254.169.254',
  '0.0.0.0',
  '[::1]',
]);

/**
 * Validates a URL for SSRF safety.
 * - Parses the URL
 * - Resolves DNS to get the actual IP
 * - Blocks private/internal/cloud-metadata IPs
 * - Only allows http and https protocols
 * 
 * Returns null if the URL is safe, or an error message string if blocked.
 */
export async function validateUrl(url: string): Promise<string | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Invalid URL format';
  }

  // Only allow http(s)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return `Protocol not allowed: ${parsed.protocol}`;
  }

  // Block known dangerous hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return `Hostname blocked: ${hostname}`;
  }

  // Resolve DNS to check the actual IP addresses
  try {
    const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
    const addresses6 = await dns.resolve6(hostname).catch(() => [] as string[]);
    const allAddresses = [...addresses, ...addresses6];

    // If we can't resolve any addresses and it's not a direct IP, that's suspicious
    if (allAddresses.length === 0) {
      // Check if hostname is already an IP
      const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
      if (isIp) {
        allAddresses.push(hostname);
      }
    }

    for (const ip of allAddresses) {
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(ip)) {
          return `Access to internal networks is not allowed`;
        }
      }
    }
  } catch {
    // DNS resolution failure — block by default for safety
    return 'DNS resolution failed for the provided URL';
  }

  return null;
}

/**
 * Validates a bare hostname or IP for SSRF safety.
 * Returns the resolved IP address to prevent DNS rebinding attacks,
 * or throws/returns an error.
 */
export async function isSafeHost(hostname: string): Promise<{ safe: boolean; ip?: string; error?: string }> {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) {
    return { safe: false, error: `Hostname blocked: ${host}` };
  }

  let allAddresses: string[] = [];
  try {
    const addresses = await dns.resolve4(host).catch(() => [] as string[]);
    const addresses6 = await dns.resolve6(host).catch(() => [] as string[]);
    allAddresses = [...addresses, ...addresses6];

    if (allAddresses.length === 0) {
      const isIp = /^[\da-f:.]+$/i.test(host);
      if (isIp) {
        allAddresses.push(host);
      } else {
        return { safe: false, error: 'Could not resolve hostname to an IP address' };
      }
    }

    for (const ip of allAddresses) {
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(ip)) {
          return { safe: false, error: `Access to internal networks is not allowed` };
        }
      }
    }
  } catch {
    return { safe: false, error: 'DNS resolution failed for the provided host' };
  }

  // Return the first resolved safe IP to prevent DNS rebinding
  return { safe: true, ip: allAddresses[0] };
}
