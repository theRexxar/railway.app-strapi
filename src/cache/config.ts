interface CacheConfig {
  apiPath: string;
  contentType: string;
  ttl: number;
  isSingleType: boolean;
}

const CACHE_CONFIGS: CacheConfig[] = [
  { apiPath: '/api/global', contentType: 'global', ttl: 3600, isSingleType: true },
  { apiPath: '/api/homepage', contentType: 'homepage', ttl: 3600, isSingleType: true },
  { apiPath: '/api/articles', contentType: 'articles', ttl: 600, isSingleType: false },
  { apiPath: '/api/courses', contentType: 'courses', ttl: 600, isSingleType: false },
  { apiPath: '/api/countries', contentType: 'countries', ttl: 3600, isSingleType: false },
  { apiPath: '/api/faqs', contentType: 'faqs', ttl: 3600, isSingleType: false },
  { apiPath: '/api/service-infos', contentType: 'service-infos', ttl: 600, isSingleType: false },
  { apiPath: '/api/personas', contentType: 'personas', ttl: 3600, isSingleType: false },
  { apiPath: '/api/content-groups', contentType: 'content-groups', ttl: 600, isSingleType: false },
  { apiPath: '/api/contents', contentType: 'contents', ttl: 600, isSingleType: false },
  { apiPath: '/api/alerts', contentType: 'alerts', ttl: 300, isSingleType: false },
  { apiPath: '/api/article-categories', contentType: 'article-categories', ttl: 3600, isSingleType: false },
  { apiPath: '/api/article-tags', contentType: 'article-tags', ttl: 3600, isSingleType: false },
  { apiPath: '/api/course-categories', contentType: 'course-categories', ttl: 3600, isSingleType: false },
  { apiPath: '/api/course-tags', contentType: 'course-tags', ttl: 3600, isSingleType: false },
  { apiPath: '/api/learning-platforms', contentType: 'learning-platforms', ttl: 3600, isSingleType: false },
  { apiPath: '/api/authors', contentType: 'authors', ttl: 3600, isSingleType: false },
  { apiPath: '/api/faq-categories', contentType: 'faq-categories', ttl: 3600, isSingleType: false },
];

interface InvalidationRule {
  selfKeys: string[];
  relatedKeys: string[];
}

const INVALIDATION_MAP: Record<string, InvalidationRule> = {
  'api::article.article': {
    selfKeys: ['articles'],
    relatedKeys: ['homepage'],
  },
  'api::service-info.service-info': {
    selfKeys: ['service-infos'],
    relatedKeys: ['homepage'],
  },
  'api::course.course': {
    selfKeys: ['courses'],
    relatedKeys: ['homepage'],
  },
  'api::content.content': {
    selfKeys: ['contents'],
    relatedKeys: ['content-groups'],
  },
  'api::content-group.content-group': {
    selfKeys: ['content-groups'],
    relatedKeys: [],
  },
  'api::country.country': {
    selfKeys: ['countries'],
    relatedKeys: ['courses', 'service-infos'],
  },
  'api::faq.faq': {
    selfKeys: ['faqs'],
    relatedKeys: [],
  },
  'api::persona.persona': {
    selfKeys: ['personas'],
    relatedKeys: ['content-groups'],
  },
  'api::alert.alert': {
    selfKeys: ['alerts'],
    relatedKeys: ['global'],
  },
  'api::article-category.article-category': {
    selfKeys: ['article-categories'],
    relatedKeys: ['articles'],
  },
  'api::article-tag.article-tag': {
    selfKeys: ['article-tags'],
    relatedKeys: ['articles'],
  },
  'api::course-category.course-category': {
    selfKeys: ['course-categories'],
    relatedKeys: ['courses'],
  },
  'api::course-tag.course-tag': {
    selfKeys: ['course-tags'],
    relatedKeys: ['courses'],
  },
  'api::learning-platform.learning-platform': {
    selfKeys: ['learning-platforms'],
    relatedKeys: ['courses'],
  },
  'api::author.author': {
    selfKeys: ['authors'],
    relatedKeys: ['articles'],
  },
  'api::faq-category.faq-category': {
    selfKeys: ['faq-categories'],
    relatedKeys: ['faqs'],
  },
  'api::global.global': {
    selfKeys: ['global'],
    relatedKeys: [],
  },
  'api::homepage.homepage': {
    selfKeys: ['homepage'],
    relatedKeys: [],
  },
};

export function getCacheConfig(apiPath: string): CacheConfig | undefined {
  return CACHE_CONFIGS.find((c) => apiPath.startsWith(c.apiPath));
}

export function getInvalidationRule(uid: string): InvalidationRule | undefined {
  return INVALIDATION_MAP[uid];
}

export function getAllCacheContentTypes(): string[] {
  return CACHE_CONFIGS.map((c) => c.contentType);
}

export function isSingleTypePath(apiPath: string): boolean {
  const config = CACHE_CONFIGS.find((c) => apiPath.startsWith(c.apiPath));
  return config?.isSingleType ?? false;
}