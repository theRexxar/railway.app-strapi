# Redis API Response Cache — Implementation Plan

## Architecture

```
Frontend → GET /api/articles
                ↓
         Strapi Cache Middleware (checks Redis)
                ↓ cache MISS
         Strapi Controller → Database
                ↓
         Response → Store in Redis → Return to Frontend
                ↓ cache HIT
         Return cached response directly
```

```
Admin Panel → Create/Update/Delete Entry
                ↓
         Lifecycle Hook (afterCreate/afterUpdate/afterDelete/afterPublish/afterUnpublish)
                ↓
         Invalidate related Redis keys
```

Redis is **not** used for search (Algolia handles that). Redis caches **full API responses** for non-search endpoints to reduce database load and improve response times.

## Scope

### Cached APIs

| API Endpoint | Type | Key Pattern | TTL | Notes |
|---|---|---|---|---|
| `GET /api/global` | singleType | `global` | 1 hour | Rarely changes, full populate |
| `GET /api/homepage` | singleType | `homepage` | 1 hour | Rarely changes, full populate |
| `GET /api/articles` | collection list | `articles:list:{queryHash}` | 10 min | Query params vary (page, filters) |
| `GET /api/articles/:slug` | collection detail | `articles:detail:{slug}` | 10 min | |
| `GET /api/courses` | collection list | `courses:list:{queryHash}` | 10 min | |
| `GET /api/courses/:slug` | collection detail | `courses:detail:{slug}` | 10 min | |
| `GET /api/countries` | collection list | `countries:list:{queryHash}` | 1 hour | Reference data, rarely changes |
| `GET /api/countries/:slug` | collection detail | `countries:detail:{slug}` | 1 hour | |
| `GET /api/service-infos` | collection list | `service-infos:list:{queryHash}` | 10 min | |
| `GET /api/service-infos/:slug` | collection detail | `service-infos:detail:{slug}` | 10 min | |
| `GET /api/personas` | collection list | `personas:list:{queryHash}` | 1 hour | Only 4 personas, rarely changes |
| `GET /api/personas/:slug` | collection detail | `personas:detail:{slug}` | 1 hour | |
| `GET /api/content-groups` | collection list | `content-groups:list:{queryHash}` | 10 min | |
| `GET /api/content-groups/:slug` | collection detail | `content-groups:detail:{slug}` | 10 min | |
| `GET /api/contents` | collection list | `contents:list:{queryHash}` | 10 min | |
| `GET /api/contents/:slug` | collection detail | `contents:detail:{slug}` | 10 min | |
| `GET /api/alerts` | collection list | `alerts:list:{queryHash}` | 5 min | Time-sensitive, short TTL |
| `GET /api/article-categories` | collection list | `article-categories:list:{queryHash}` | 1 hour | Reference data |
| `GET /api/article-tags` | collection list | `article-tags:list:{queryHash}` | 1 hour | Reference data |
| `GET /api/course-categories` | collection list | `course-categories:list:{queryHash}` | 1 hour | Reference data |
| `GET /api/course-tags` | collection list | `course-tags:list:{queryHash}` | 1 hour | Reference data |
| `GET /api/learning-platforms` | collection list | `learning-platforms:list:{queryHash}` | 1 hour | Reference data |
| `GET /api/authors` | collection list | `authors:list:{queryHash}` | 1 hour | Reference data |

### NOT Cached

| Endpoint | Reason |
|---|---|
| `GET /api/search` | Already served by Algolia (sub-100ms) |
| `POST/PUT/DELETE` any endpoint | Write operations, never cached |
| Admin API routes | Admin panel should always see fresh data |
| Auth routes (`/api/users-permissions/*`) | Authentication must be real-time |

## Invalidation Strategy

Lifecycle hooks invalidate cache when data changes. This runs alongside Algolia hooks in the same `src/index.ts` bootstrap.

### Invalidation Rules

On any write event (afterCreate, afterUpdate, afterDelete, afterPublish, afterUnpublish) for a content type:

1. **Invalidate all list keys** for that content type — `del` pattern `type:list:*`
2. **Invalidate the detail key** for the specific documentId — `del` `type:detail:{slug}`
3. **Invalidate related types** that reference this data:
   - When an article-category/tag changes → invalidate `articles:list:*`
   - When a course-category/tag changes → invalidate `courses:list:*`
   - When an author changes → invalidate `articles:list:*`
   - When a learning-platform changes → invalidate `courses:list:*`
   - When a country changes → invalidate `countries:*`, `courses:list:*`, `service-infos:list:*`
   - When a persona changes → invalidate `content-groups:list:*`
   - When content changes → invalidate `content-groups:list:*`
   - When an article/course/service-info changes → also invalidate `homepage` (featured items)

### Invalidation Mapping

| Content Type UID | Invalidate Self | Invalidate Related |
|---|---|---|
| `api::article.article` | `articles:*` | `homepage` |
| `api::service-info.service-info` | `service-infos:*` | `homepage` |
| `api::course.course` | `courses:*` | `homepage` |
| `api::content.content` | `contents:*` | `content-groups:*` |
| `api::content-group.content-group` | `content-groups:*` | |
| `api::country.country` | `countries:*` | `courses:list:*`, `service-infos:list:*` |
| `api::persona.persona` | `personas:*` | `content-groups:list:*` |
| `api::alert.alert` | `alerts:*` | `global` |
| `api::article-category.article-category` | `article-categories:*` | `articles:*` |
| `api::article-tag.article-tag` | `article-tags:*` | `articles:*` |
| `api::course-category.course-category` | `course-categories:*` | `courses:*` |
| `api::course-tag.course-tag` | `course-tags:*` | `courses:*` |
| `api::learning-platform.learning-platform` | `learning-platforms:*` | `courses:*` |
| `api::author.author` | `authors:*` | `articles:*` |
| `api::global.global` | `global` | |
| `api::homepage.homepage` | `homepage` | |

## Implementation Approach

**Strapi v5 middleware** — A custom Koa middleware that intercepts GET requests before they reach the controller. This is cleaner than modifying every controller because:

1. Works with both custom controllers (`global`, `homepage`) and default core controllers
2. No need to override every controller method
3. Centralized cache logic in one place
4. Easy to enable/disable per route via config

### Middleware Flow

```
Request → Cache Middleware
  │
  ├─ Not GET? → next()
  ├─ Not /api/*? → next()
  ├─ Is /api/search? → next() (Algolia handles this)
  │
  ├─ Build cache key from URL + query string hash
  │
  ├─ Cache HIT? → Return cached response (304 if ETag matches)
  └─ Cache MISS? → next() → intercept response → store in Redis → return
```

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/cache/client.ts` | Redis client singleton (init from env, graceful shutdown) |
| 2 | `src/cache/config.ts` | Cache config: content type → TTL, invalidation rules |
| 3 | `src/cache/keys.ts` | Cache key builder (URL → Redis key) |
| 4 | `src/cache/middleware.ts` | Koa middleware that intercepts GET /api/* requests |
| 5 | `src/cache/invalidation.ts` | Cache invalidation functions called by lifecycle hooks |
| 6 | `src/cache/index.ts` | Barrel export |
| 7 | `config/middlewares.ts` | (modify) Register cache middleware |

## Files to Modify

| File | Change |
|---|---|
| `src/index.ts` | Register cache invalidation hooks in bootstrap (alongside Algolia hooks) |
| `config/middlewares.ts` | Add cache middleware to Koa middleware stack |
| `package.json` | Add `ioredis` dependency |
| `.env` | Add `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` |

## Redis Key Design

```
jari-pmi:cache:global                                    → JSON string
jari-pmi:cache:homepage                                  → JSON string
jari-pmi:cache:articles:list:a1b2c3                      → JSON string (queryHash)
jari-pmi:cache:articles:detail:panduan-lengkap-pmi       → JSON string
jari-pmi:cache:courses:list:d4e5f6                       → JSON string
...
```

Prefix: `jari-pmi:cache:` to namespace in shared Redis instances.

**queryHash**: SHA-256 of sorted query string parameters. For `?page=1&pageSize=10&populate=*`, hash the normalized query to produce a deterministic key.

**TTL assignment**: Configured per content type in `src/cache/config.ts`. SingleTypes and reference data = 3600s (1h), frequently updated content = 600s (10m), alerts = 300s (5m).

## Environment Variables

```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_ENABLED=true
REDIS_CACHE_PREFIX=jari-pmi:cache:
```

`REDIS_CACHE_ENABLED=false` disables caching entirely (useful for development or debugging).

## Deployment (Railway)

Railway supports Redis via the Railway Redis plugin or Upstash. Add the Redis service to the Railway project and set the env vars from the Railway Redis connection string.

In `Dockerfile` — no changes needed. Redis is a network service, not a build dependency.

## Error Handling

- **Redis connection fails**: Middleware logs a warning and falls through to the database (cache-aside pattern). The app must never crash because Redis is unavailable.
- **Redis read error**: Treat as cache miss, continue to controller.
- **Redis write error**: Log warning, return response normally (just not cached).
- **Redis connection restored**: Auto-reconnect via `ioredis` built-in retry strategy.

## Key Design Decisions

- **Middleware approach** (not service-layer) — Caches at the HTTP response level, works for all controllers without modifying each one
- **Cache-aside pattern** — Redis failure doesn't break the app; responses always come from the database on cache miss
- **Query hash keys for lists** — Different query param combinations get different cache entries, preserving filter/pagination accuracy
- **Aggressive invalidation on writes** — Clear all list keys + related type keys on any write, ensuring stale data is never served
- **No cache for admin** — Admin API requests bypass cache entirely (should always see fresh data)
- **Conditionally enabled** — `REDIS_CACHE_ENABLED=false` or missing Redis env vars → cache middleware becomes a no-op
- **No cache for `/api/search`** — Algolia is already fast, doubling up in Redis adds complexity with no benefit
- **ETag support** — Store ETag header in cached response, support 304 Not Modified (future optimization, not in initial implementation)

## Implementation Order

1. `npm install ioredis` + add env vars to `.env`
2. Create `src/cache/client.ts` (Redis client singleton)
3. Create `src/cache/config.ts` (TTL config per content type)
4. Create `src/cache/keys.ts` (key builder)
5. Create `src/cache/middleware.ts` (Koa middleware)
6. Create `src/cache/invalidation.ts` + `src/cache/index.ts`
7. Modify `config/middlewares.ts` to register cache middleware
8. Modify `src/index.ts` to register invalidation hooks in bootstrap
9. Test: verify cache HIT/MISS logs, verify invalidation on create/update/delete