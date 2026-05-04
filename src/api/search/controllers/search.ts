import { Context } from 'koa';
import { getSearchableTypes } from '../../../algolia/config';
import { getRedisClient } from '../../../cache/client';

function isAlgoliaConfigured(): boolean {
  return !!(
    process.env.ALGOLIA_APPLICATION_ID &&
    process.env.ALGOLIA_SEARCH_API_KEY
  );
}

function trackSearchQuery(query: string) {
  const redis = getRedisClient();
  if (!redis) return;
  const normalized = query.trim().toLowerCase();
  if (!normalized) return;
  redis.zincrby('popular_searches', 1, normalized).catch(() => {});
}

export default {
  async search(ctx: Context) {
    if (!isAlgoliaConfigured()) {
      ctx.status = 503;
      ctx.body = { error: { message: 'Search is not configured' } };
      return;
    }

    const { q, type, page, hitsPerPage, ...rest } = ctx.query;

    const query = typeof q === 'string' ? q : '';
    if (!query.trim()) {
      ctx.status = 400;
      ctx.body = { error: { message: 'Query parameter "q" is required' } };
      return;
    }

    const pageNum = Math.max(0, parseInt(String(page || '0'), 10));
    const hitsPerPageNum = Math.min(100, Math.max(1, parseInt(String(hitsPerPage || '20'), 10)));

    const facetFilters: Record<string, string[]> = {};
    const searchableTypes = getSearchableTypes();
    const facetNames = searchableTypes.flatMap((c) => c.facets);

    for (const [key, value] of Object.entries(rest)) {
      if (facetNames.includes(key)) {
        facetFilters[key] = String(value).split(',');
      }
    }

    try {
      const { search } = await import('../services/algolia');
      const result = await search(query, {
        type: typeof type === 'string' ? type : undefined,
        page: pageNum,
        hitsPerPage: hitsPerPageNum,
        facetFilters: Object.keys(facetFilters).length > 0 ? facetFilters : undefined,
      });

      trackSearchQuery(query);

      ctx.body = {
        data: {
          hits: result.hits,
          nbHits: result.nbHits,
          page: result.page,
          nbPages: result.nbPages,
          hitsPerPage: result.hitsPerPage,
          query: result.query,
          facets: result.facets,
        },
      };
    } catch (error: any) {
      ctx.status = 500;
      ctx.body = { error: { message: 'Search service temporarily unavailable' } };
    }
  },
};