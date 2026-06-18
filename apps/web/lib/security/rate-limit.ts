import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// ─── Upstash Redis Rate Limiting ───────────────────────────────────────────────

/**
 * RateLimitService abstraction wrapping Upstash Redis sliding window.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 */

export type RateLimitTier = 'ai' | 'upload' | 'database' | 'auth' | 'mcp' | 'default';

const RATE_LIMITS: Record<RateLimitTier, { requests: number; window: string }> = {
  ai: { requests: 30, window: '1 m' },
  upload: { requests: 10, window: '1 m' },
  database: { requests: 20, window: '1 m' },
  auth: { requests: 5, window: '1 m' },
  mcp: { requests: 60, window: '1 m' },
  default: { requests: 60, window: '1 m' },
};

let redisInstance: Redis | null = null;
const rateLimiters = new Map<RateLimitTier, Ratelimit>();

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[RateLimitService] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting disabled.');
    return null;
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

function getRateLimiter(tier: RateLimitTier): Ratelimit | null {
  if (rateLimiters.has(tier)) return rateLimiters.get(tier)!;

  const redis = getRedis();
  if (!redis) return null;

  const config = RATE_LIMITS[tier];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window as `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`),
    prefix: `ratelimit:${tier}`,
    analytics: true,
  });

  rateLimiters.set(tier, limiter);
  return limiter;
}

export class RateLimitService {
  private tier: RateLimitTier;

  constructor(tier: RateLimitTier = 'default') {
    this.tier = tier;
  }

  /**
   * Checks rate limit for the given identifier (usually user ID or IP).
   * Returns null if allowed, or a 429 NextResponse if rate limited.
   */
  async check(identifier: string): Promise<NextResponse | null> {
    const limiter = getRateLimiter(this.tier);
    if (!limiter) {
      // Rate limiting disabled (no Redis configured) — allow request
      return null;
    }

    try {
      const result = await limiter.limit(identifier);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.reset.toString(),
              'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }

      return null;
    } catch (error) {
      // If Redis is down, fail open (allow the request) but log
      console.error('[RateLimitService] Redis error, failing open:', error);
      return null;
    }
  }

  /**
   * Static helper for quick one-line rate limiting in route handlers.
   */
  static async check(identifier: string, tier: RateLimitTier = 'default'): Promise<NextResponse | null> {
    const service = new RateLimitService(tier);
    return service.check(identifier);
  }
}
