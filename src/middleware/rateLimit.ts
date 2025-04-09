import type { Context, Next } from 'hono';
import * as logger from '../utils/logger';
import { config } from '../config/env';

// Interface for rate limit options
interface RateLimitOptions {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Maximum number of requests per window
  message?: string;     // Custom message for rate limit exceeded
  statusCode?: number;  // Status code to return when rate limit exceeded
}

// Interface for rate limit store
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
const store: RateLimitStore = {};

// Clean up expired entries periodically
const cleanupInterval = 15 * 60 * 1000; // 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
      logger.debug(`Rate limit entry cleaned up: ${key}`);
    }
  }
}, cleanupInterval);

/**
 * Rate limiting middleware for Hono
 * @param options Rate limiting options
 * @returns Hono middleware function
 */
export function rateLimit(options: RateLimitOptions) {
  const windowMs = options.windowMs || 60 * 1000; // Default: 1 minute
  const maxRequests = options.maxRequests || 100; // Default: 100 requests per minute
  const message = options.message || 'Too many requests, please try again later';
  const statusCode = options.statusCode || 429; // Too Many Requests

  return async (c: Context, next: Next) => {
    // Skip rate limiting if disabled in config
    if (!config.RATE_LIMIT_ENABLED) {
      return next();
    }

    // Get client IP with retry logic for reliability
    const getClientIp = () => {
      return c.req.header('x-forwarded-for')?.split(',')[0].trim() || 
             c.req.header('x-real-ip') || 
             c.env?.remoteAddr || 
             'unknown';
    };
    
    const ip = getClientIp();
    
    // Create a key that includes the route pattern
    const key = `${ip}:${c.req.path}`;
    
    const now = Date.now();
    
    // Initialize or reset if window has passed
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Increment request count
    store[key].count++;
    
    // Calculate remaining requests and reset time
    const remaining = Math.max(0, maxRequests - store[key].count);
    const resetTime = store[key].resetTime;
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
    
    // If rate limit exceeded
    if (store[key].count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${key} (${ip}) on path ${c.req.path}`);
      
      // Set retry-after header
      const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);
      c.header('Retry-After', retryAfterSeconds.toString());
      
      return c.json({
        status: 'error',
        message,
        retryAfter: retryAfterSeconds
      }, statusCode);
    }
    
    // Continue to the next middleware/route handler
    return next();
  };
}

/**
 * Create endpoint-specific rate limiters
 * @returns Object with rate limiters for different endpoint types
 */
export function createRateLimiters() {
  return {
    // Status endpoints - highest limits
    status: rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      maxRequests: config.RATE_LIMIT_STATUS_MAX,
      message: 'Rate limit exceeded for status endpoint. Please try again later.'
    }),
    
    // Standard API endpoints - medium limits
    standard: rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      maxRequests: config.RATE_LIMIT_STANDARD_MAX,
      message: 'Rate limit exceeded. Please try again later.'
    }),
    
    // Data-intensive endpoints - lowest limits
    dataIntensive: rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      maxRequests: config.RATE_LIMIT_DATA_MAX,
      message: 'Rate limit exceeded for data-intensive endpoint. Please try again later.'
    })
  };
}
