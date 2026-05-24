# Algolia Global Search — Implementation Plan

**Status: ✅ Fully Implemented** — All 11 files created, lifecycle hooks active, search proxy live.

## Architecture

```
Frontend → GET /api/search?q=pelindungan&type=article
                    ↓
         Strapi Search Controller (public, auth: false)
                    ↓
              Algolia Index (search-only key)
                    ↑
    Lifecycle Hooks (afterCreate/afterUpdate/afterDelete)
                    ↑
              Strapi CRUD
```

**Single unified index** (`ALGOLIA_INDEX_NAME`) with a `type` facet field. Not separate indices per content type. This enables true global search with mixed result types rendered differently on the frontend.

## Searchable Content Types (6)

| Type | UID | Title Field | Searchable Text | Image Field | Facets | Draft/Publish |
|------|-----|-------------|----------------|-------------|--------|---------------|
| `article` | `api::article.article` | title | content | cover_image | article_category.slug, article_tags[].slug, author.slug | yes |
| `service-info` | `api::service-info.service-info` | name | description | image | countries[].slug | yes |
| `course` | `api::course.course` | name | description | image | course_category.slug, course_tags[].slug | yes |
| `content` | `api::content.content` | title | body | image | content_group.slug | yes |
| `country` | `api::country.country` | name | description | flag | region | no |
| `persona` | `api::persona.persona` | name | description | image | — | no |

## Excluded from Search

alert, content-group, article-category, article-tag, course-category, course-tag, learning-platform, course-learning-method, curriculum, announcement, faq, faq-category, tool, province, purna-pmi, author, homepage, global

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `src/algolia/client.ts` | Algolia client singleton — `init()` from env vars, `isAlgoliaEnabled()`, `getIndexName()`, `getSearchOnlyClient()` |
| 2 | `src/algolia/config.ts` | Searchable types config — `SearchableTypeConfig` interface with `uid`, `type`, `titleField`, `textField`, `snippetField`, `excerptField`, `imageField`, `facets`, `populate`, `draftAndPublish` |
| 3 | `src/algolia/utils.ts` | `stripHtml()` — regex strip HTML tags, `truncate()` — truncate to 300 chars |
| 4 | `src/algolia/transformers.ts` | `transformToAlgoliaRecord()` — Map Strapi entry → Algolia record per type, including image URL extraction |
| 5 | `src/algolia/hooks.ts` | `registerAlgoliaHooks()` — afterCreate/afterUpdate/afterDelete lifecycle hooks for all 6 searchable types |
| 6 | `src/algolia/indexer.ts` | `reindexAll()` — Full index rebuild with clear + batch save |
| 7 | `src/api/search/controllers/search.ts` | Search proxy controller — calls Algolia with search-only key, tracks queries in Redis |
| 8 | `src/api/search/services/algolia.ts` | Search service wrapping Algolia client calls |
| 9 | `src/api/search/routes/search.ts` | Route: `GET /api/search` (public, `auth: false`) |
| 10 | `src/api/popular-searches/` | Custom API — returns top 5 searches from Redis sorted set |
| 11 | `src/index.ts` | (modified) Register Algolia hooks in bootstrap when env vars present |

## Files Modified

| File | Change |
|------|--------|
| `src/index.ts` | `registerAlgoliaHooks(strapi)` in bootstrap when Algolia enabled |
| `package.json` | `algoliasearch: ^5.51.0` dependency + `reindex` script (`REINDEX=true strapi develop`) |
| `.env` / `.env.example` | `ALGOLIA_APPLICATION_ID`, `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_SEARCH_API_KEY`, `ALGOLIA_INDEX_NAME` |

## Algolia Record Shape

Only a truncated searchable snippet and image URL are stored — the frontend fetches full content from Strapi when the user navigates to a detail page. This saves Algolia record size and costs.

```json
{
  "objectID": "abc123",
  "type": "article",
  "slug": "panduan-lengkap-menjadi-pmi-yang-terlindungi",
  "title": "Panduan Lengkap Menjadi PMI yang Terlindungi",
  "excerpt": "Ketahui langkah-langkah penting...",
  "content_snippet": "Menjadi Pekerja Migran Indonesia (PMI) yang terlindungi membutuhkan pemahaman menyeluruh tentang hak-hak Anda...",
  "image_url": "https://res.cloudinary.com/jari-pmi/image/upload/v123/cover.jpg",
  "image_width": 800,
  "image_height": 600,
  "image_alt": "Ilustrasi PMI",
  "article_category": ["perlindungan"],
  "article_tags": ["migrasi", "hukum"],
  "author": ["admin-jari-pmi"],
  "published_at": 1745800000,
  "updated_at": 1745800000
}
```

**Fields per type:**

| Type | Fields stored in Algolia |
|------|------------------------|
| `article` | objectID, type, slug, title, excerpt, content_snippet (300 chars), image_url, image_width, image_height, image_alt, article_category[], article_tags[], author, published_at, updated_at |
| `service-info` | objectID, type, slug, name, excerpt, description_snippet (300 chars), image_url, image_width, image_height, image_alt, countries[], published_at, updated_at |
| `course` | objectID, type, slug, name, excerpt, description_snippet (300 chars), image_url, image_width, image_height, image_alt, course_category, course_tags[], is_featured, published_at, updated_at |
| `content` | objectID, type, slug, title, excerpt, body_snippet (300 chars), image_url, image_width, image_height, image_alt, content_group, published_at, updated_at |
| `country` | objectID, type, slug, name, description_snippet (300 chars), image_url, image_width, image_height, image_alt, region, is_featured, updated_at |
| `persona` | objectID, type, slug, name, description_snippet (300 chars), image_url, image_width, image_height, image_alt, updated_at |

## Image Field Mapping

Each searchable type has an `imageField` in its config. The transformer extracts:

| Type | imageField | Strapi Schema Field |
|------|-----------|---------------------|
| `article` | `cover_image` | media (single, images, required) |
| `service-info` | `image` | media (single, images, required) |
| `course` | `image` | media (single, images, required) |
| `content` | `image` | media (single, images) |
| `country` | `flag` | media (single, images, required) |
| `persona` | `image` | media (single, images, required) |

The image field is added to each type's `populate` string so it's included in re-fetch queries.

## Key Design Decisions

- **Single index** with `type` field — unified search, frontend renders different card styles per type
- **`objectID` = Strapi `documentId`** — natural mapping
- **Relation facets stored as slug arrays** — filterable with `filterOnly()`
- **Truncated content only** — Rich text fields are HTML-stripped and truncated to ~300 chars as `*_snippet`. Full content is fetched from Strapi by the frontend when needed, not stored in Algolia. This keeps record sizes small and reduces Algolia costs.
- **Image URL stored** — `image_url`, `image_width`, `image_height`, `image_alt` extracted from Strapi media objects for search result card rendering
- **HTML stripped via regex** — CKEditor stores `<p>` tags, no extra dependency needed
- **Draft handling** — `draftAndPublish: true` types only index when `publishedAt !== null`
- **Re-fetch on lifecycle events** — `event.result` doesn't include populated relations, must re-fetch with populate
- **Draft/publish hooks** — `afterCreate` only indexes for `draftAndPublish: false` types (country, persona). `draftAndPublish: true` types are only indexed on publish via `afterUpdate` checking `publishedAt`.
- **Public search proxy** — `/api/search` requires no auth, uses search-only key server-side
- **Conditionally enabled** — Only registers hooks when `ALGOLIA_APPLICATION_ID` and `ALGOLIA_ADMIN_API_KEY` env vars are set
- **Reindex via CLI** — `npm run reindex` for initial/forced full reindex
- **Relation change edge case** — If a related entity changes (e.g. article-category slug rename), the parent article's hook doesn't fire. Run `npm run reindex` to fix. This tradeoff avoids complex reverse-relation tracking.

## API Endpoint

```
GET /api/search?q=perlindungan
GET /api/search?q=pmi&type=article
GET /api/search?q=kerja&type=article,service-info
GET /api/search?q=kerja&region=asia
GET /api/search?q=kerja&page=2&hitsPerPage=10
```

Response:
```json
{
  "data": {
    "hits": [...],
    "nbHits": 42,
    "page": 0,
    "nbPages": 5,
    "hitsPerPage": 10,
    "query": "kerja",
    "facets": { "type": { "article": 12, "service-info": 8 } }
  }
}
```

## Popular Searches API

```
GET /api/search/popular
```

Response:
```json
{
  "data": [
    { "query": "pelatihan", "count": 156 },
    { "query": "pmi", "count": 142 },
    { "query": "malaysia", "count": 98 },
    { "query": "keuangan", "count": 87 },
    { "query": "perlindungan", "count": 65 }
  ]
}
```

Tracks search queries in a Redis sorted set (`jari-pmi:popular-searches`), updated on each `/api/search` request. Returns top 5 by default.

## Environment Variables

```
ALGOLIA_APPLICATION_ID=your-app-id
ALGOLIA_ADMIN_API_KEY=your-admin-key
ALGOLIA_SEARCH_API_KEY=your-search-only-key
ALGOLIA_INDEX_NAME=jari_pmi_dev
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run reindex` | Full Algolia reindex (clears index + batch imports all records) |
| `npm run seed` + `npm run reindex` | Full database seed + search index sync |

## Implementation Order (Completed)

1. ✅ `npm install algoliasearch` + add env vars to `.env`
2. ✅ Create `src/algolia/client.ts`, `config.ts`, `utils.ts`
3. ✅ Create `src/algolia/transformers.ts`
4. ✅ Create `src/algolia/hooks.ts`
5. ✅ Create `src/algolia/indexer.ts`
6. ✅ Modify `src/index.ts` to register hooks on bootstrap
7. ✅ Create `src/api/search/` (service, controller, routes)
8. ✅ Create `src/api/popular-searches/` (controller, routes, service)
9. ✅ Run initial reindex and test `/api/search`
10. ⬜ Configure Algolia synonyms in dashboard (PMI ↔ Pekerja Migran Indonesia, TKI ↔ Tenaga Kerja Indonesia)
