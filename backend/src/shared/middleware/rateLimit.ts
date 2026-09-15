import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const prune = () => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

setInterval(prune, 60_000).unref();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  code?: string;
}

/**
 * Minimal in-memory fixed-window rate limiter.
 * Matches API_SPEC.md §19 thresholds. For multi-instance production,
 * replace the Map backing with Redis INCR+EXPIRE (see ARCHITECTURE.md §9).
 */
export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, max, keyGenerator, code = 'RATE_LIMITED' } = options;
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.baseUrl}${req.path}:${keyGenerator ? keyGenerator(req) : req.ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      next(
        new AppError('Too many requests, please try again later', 429, code, {
          retryAfter,
        })
      );
      return;
    }
    next();
  };
};

export const ipKey = (req: Request): string => req.ip ?? 'unknown-ip';
export const userKey = (req: Request): string => req.user?.id ?? req.ip ?? 'unknown';
export const phoneKey = (req: Request): string =>
  typeof req.body?.phone === 'string' ? `otp:${req.body.phone}` : `otp:${req.ip}`;

/** API_SPEC.md §19 preset limits */
export const authRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 10, keyGenerator: ipKey });
export const otpRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 5, keyGenerator: phoneKey });
export const mutationRateLimit = rateLimit({ windowMs: 60 * 60_000, max: 20, keyGenerator: userKey });
export const generalRateLimit = rateLimit({ windowMs: 15 * 60_000, max: 300, keyGenerator: userKey });
