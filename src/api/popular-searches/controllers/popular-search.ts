import { Context } from 'koa';
import { getRedisClient } from '../../../cache/client';

export default {
  async popularSearches(ctx: Context) {
    const redis = getRedisClient();

    if (!redis) {
      ctx.body = { data: [] };
      return;
    }

    try {
      const results = await redis.zrevrange('popular_searches', 0, 4, 'WITHSCORES');

      const searches: { keyword: string; count: number }[] = [];
      for (let i = 0; i < results.length; i += 2) {
        searches.push({
          keyword: results[i],
          count: parseInt(results[i + 1], 10),
        });
      }

      ctx.body = { data: searches };
    } catch (err: any) {
      ctx.body = { data: [] };
    }
  },
};
