import { Context } from 'koa';
import { getRedisClient, isCacheEnabled } from './client';
import { getCacheConfig } from './config';
import { buildCacheKey } from './keys';

const SKIP_PATHS = ['/api/search', '/admin', '/content-type-builder', '/users-permissions'];

export function cacheMiddleware() {
  return async (ctx: Context, next: () => Promise<any>) => {
    if (!isCacheEnabled()) {
      return next();
    }

    if (ctx.method !== 'GET') {
      return next();
    }

    const path = ctx.path;

    if (!path.startsWith('/api/')) {
      return next();
    }

    if (SKIP_PATHS.some((skip) => path.startsWith(skip))) {
      return next();
    }

    const cacheConfig = getCacheConfig(path);
    if (!cacheConfig) {
      return next();
    }

    const redis = getRedisClient();
    if (!redis) {
      return next();
    }

    const cacheKey = buildCacheKey(path, ctx.querystring);
    if (!cacheKey) {
      return next();
    }

    try {
      let redisConnected = true;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          ctx.set('X-Cache', 'HIT');
          ctx.status = 200;
          ctx.body = JSON.parse(cached);
          return;
        }
      } catch (err: any) {
        redisConnected = false;
      }

      await next();

      if (ctx.status >= 200 && ctx.status < 300 && ctx.body) {
        try {
          let body: any;
          if (typeof ctx.body === 'string') {
            body = ctx.body;
          } else {
            body = JSON.stringify(ctx.body);
          }
          await redis.set(cacheKey, typeof body === 'string' ? body : JSON.stringify(body), 'EX', cacheConfig.ttl);
          ctx.set('X-Cache', 'MISS');
        } catch (err: any) {
          ctx.set('X-Cache', 'MISS');
        }
      }
    } catch (err: any) {
      ctx.set('X-Cache', 'MISS');
      return next();
    }
  };
}