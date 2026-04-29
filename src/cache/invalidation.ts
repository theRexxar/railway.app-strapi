import { getRedisClient, isCacheEnabled } from './client';
import { getInvalidationRule } from './config';
import { getCachePrefix } from './keys';

export async function invalidateForContentType(uid: string): Promise<void> {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  const rule = getInvalidationRule(uid);
  if (!rule) return;

  const allContentTypes = [...rule.selfKeys, ...rule.relatedKeys];
  const prefix = getCachePrefix();

  for (const contentType of allContentTypes) {
    try {
      const pattern = `${prefix}${contentType}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Invalidated ${keys.length} keys for pattern ${pattern}`);
      }

      const singleKey = `${prefix}${contentType}`;
      const exists = await redis.exists(singleKey);
      if (exists) {
        await redis.del(singleKey);
        console.log(`[Cache] Invalidated single key ${singleKey}`);
      }
    } catch (err: any) {
      console.warn(`[Cache] Failed to invalidate ${contentType}:`, err.message);
    }
  }
}

export async function invalidateDetail(uid: string, slug: string): Promise<void> {
  if (!isCacheEnabled()) return;

  const redis = getRedisClient();
  if (!redis) return;

  const rule = getInvalidationRule(uid);
  if (!rule) return;

  const prefix = getCachePrefix();

  for (const contentType of rule.selfKeys) {
    try {
      const detailKey = `${prefix}${contentType}:detail:${slug}`;
      const exists = await redis.exists(detailKey);
      if (exists) {
        await redis.del(detailKey);
        console.log(`[Cache] Invalidated detail key ${detailKey}`);
      }
    } catch (err: any) {
      console.warn(`[Cache] Failed to invalidate detail for ${slug}:`, err.message);
    }
  }
}