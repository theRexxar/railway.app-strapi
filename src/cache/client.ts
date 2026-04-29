import Redis from 'ioredis';

let redis: Redis | null = null;

function parseRedisUrl(): { host: string; port: number; password?: string; db: number } | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port, 10) || 6379,
      password: parsed.password || undefined,
      db: parseInt(parsed.pathname?.slice(1) || '0', 10),
    };
  } catch {
    return null;
  }
}

export function getRedisClient(): Redis | null {
  if (!isCacheEnabled()) return null;

  if (redis) return redis;

  try {
    const urlConfig = parseRedisUrl();

    if (urlConfig) {
      redis = new Redis({
        host: urlConfig.host,
        port: urlConfig.port,
        password: urlConfig.password,
        db: urlConfig.db,
        maxRetriesPerRequest: 1,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
    } else {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        maxRetriesPerRequest: 1,
        retryStrategy(times: number) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });
    }

    redis.on('error', (err) => {
      console.warn('[Cache] Redis error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Cache] Redis connected');
    });
  } catch (err: any) {
    console.warn('[Cache] Failed to create Redis client:', err.message);
    redis = null;
  }

  return redis;
}

export function isCacheEnabled(): boolean {
  return process.env.REDIS_CACHE_ENABLED !== 'false' &&
    !!(process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDIS_PORT);
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}