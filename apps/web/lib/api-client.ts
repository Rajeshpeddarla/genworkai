/**
 * Global API Client for Developer Portal
 * Intercepts 429 requests and triggers global events so the UI can show quota exhaustion modals.
 */

export const gkFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  
  if (response.status === 429) {
    // Dispatch a global event that components (like GlobalQuotaToast) can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gk-quota-exhausted'));
    }
  }

  // Parse rate limit headers for progressive warnings
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const limit = response.headers.get('X-RateLimit-Limit');
  
  if (remaining && limit) {
    const remainingNum = parseInt(remaining, 10);
    const limitNum = parseInt(limit, 10);
    
    if (limitNum > 0) {
      const usedPercentage = ((limitNum - remainingNum) / limitNum) * 100;
      
      if (usedPercentage >= 90) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gk-quota-warning', { detail: { level: 90 } }));
        }
      } else if (usedPercentage >= 75) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gk-quota-warning', { detail: { level: 75 } }));
        }
      }
    }
  }

  return response;
};
