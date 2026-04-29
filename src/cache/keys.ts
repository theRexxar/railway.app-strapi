import { createHash } from 'crypto';
import { getCacheConfig } from './config';

const PREFIX = () => process.env.REDIS_CACHE_PREFIX || 'jari-pmi:cache:';

export function buildCacheKey(apiPath: string, queryString: string): string {
  const base = PREFIX();
  const config = getCacheConfig(apiPath);
  if (!config) return '';

  if (config.isSingleType) {
    return `${base}${config.contentType}`;
  }

  const isDetailRequest = isDetailPath(apiPath, config.apiPath);

  if (isDetailRequest) {
    const slug = extractSlug(apiPath, config.apiPath);
    return `${base}${config.contentType}:detail:${slug}`;
  }

  const queryHash = hashQueryString(queryString);
  return `${base}${config.contentType}:list:${queryHash}`;
}

function isDetailPath(apiPath: string, basePath: string): boolean {
  const after = apiPath.slice(basePath.length);
  return after.length > 1 && after.startsWith('/');
}

function extractSlug(apiPath: string, basePath: string): string {
  const after = apiPath.slice(basePath.length + 1);
  const slashIdx = after.indexOf('/');
  return slashIdx === -1 ? after : after.slice(0, slashIdx);
}

function hashQueryString(qs: string): string {
  if (!qs) return 'default';
  const sorted = qs
    .split('&')
    .filter(Boolean)
    .sort()
    .join('&');
  return createHash('sha256').update(sorted).digest('hex').slice(0, 12);
}

export function buildInvalidationKeys(contentTypes: string[]): string[] {
  const base = PREFIX();
  return contentTypes.map((ct) => `${base}${ct}:*`);
}

export function buildSingleTypeKey(contentType: string): string {
  return `${PREFIX()}${contentType}`;
}

export function getCachePrefix(): string {
  return PREFIX();
}