# Algolia Global Search — Implementation Plan

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

**Single unified index** (`jari_pmi_dev`) with a `type` facet field. Not separate indices per content type. This enables true global search with mixed result types rendered differently on the frontend.

## Searchable Content Types (7)

| Type | UID | Title Field | Searchable Text | Facets | Draft/Publish |
|------|-----|-------------|----------------|--------|---------------|
| `article` | `api::article.article` | title | content (truncated 300 chars) | article_category.slug, article_tags[].slug, author.slug | yes |
| `service-info` | `api::service-info.service-info` | title | content (truncated 300 chars) | category, countries[].slug | yes |
| `protection-info` | `api::protection-info.protection-info` | title | content (truncated 300 chars) | category | no |
| `course` | `api::course.course` | name | description (truncated 300 chars) | course_category.slug, course_tags[].slug, countries[].slug | yes |
| `content` | `api::content.content` | title | body (truncated 300 chars) | content_group.slug | yes |
| `country` | `api::country.country` | name | description (truncated 300 chars) | region, is_featured | no |
| `persona` | `api::persona.persona` | name | description (truncated 300 chars) | — | no |

## Excluded from Search (10)

alert, content-group, article-category, article-tag, course-category, course-tag, learning-platform, author, homepage, global

## Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `src/algolia/client.ts` | Algolia client singleton (init from env vars) |
| 2 | `src/algolia/config.ts` | Searchable types config: uid → { titleField, textField, facets, populate, draftAndPublish } |
| 3 | `src/algolia/utils.ts` | `stripHtml()`, `truncate()` helpers (strip HTML, truncate to 300 chars) |
| 4 | `src/algolia/transformers.ts` | Map Strapi entry → Algolia record per content type |
| 5 | `src/algolia/hooks.ts` | Register afterCreate/afterUpdate/afterDelete/afterPublish/afterUnpublish lifecycle hooks for all 7 searchable types |
| 6 | `src/algolia/indexer.ts` | `reindexAll()` function for initial/forced full reindex |
| 7 | `src/api/search/content-types/search/schema.json` | Search API content type schema (minimal) |
| 8 | `src/api/search/controllers/search.ts` | Search proxy controller — calls Algolia with search-only key |
| 9 | `src/api/search/services/search.ts` | Search service wrapping Algolia calls |
| 10 | `src/api/search/routes/search.ts` | Route config: GET /api/search (public, auth: false) |
| 11 | `scripts/reindex.ts` | CLI reindex script |

## Files to Modify

| File | Change |
|------|--------|
| `src/index.ts` | Add Algolia hook registration in bootstrap() when env vars present |
| `package.json` | Add `algoliasearch` dependency + `reindex` script |
| `.env` | Add `ALGOLIA_APPLICATION_ID`, `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_SEARCH_API_KEY`, `ALGOLIA_INDEX_NAME` |

## Algolia Record Shape (Example: article)

Only a truncated searchable snippet is stored — the frontend fetches full content from Strapi via `/api/articles/:slug` when the user navigates to a detail page. This saves Algolia record size and costs.

```json
{
  "objectID": "abc123",
  "type": "article",
  "slug": "panduan-lengkap-menjadi-pmi-yang-terlindungi",
  "title": "Panduan Lengkap Menjadi PMI yang Terlindungi",
  "excerpt": "Ketahui langkah-langkah penting...",
  "content_snippet": "Menjadi Pekerja Migran Indonesia (PMI) yang terlindungi membutuhkan pemahaman menyeluruh tentang hak-hak Anda. Berikut panduan lengkap yang...",
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
| `article` | objectID, type, slug, title, excerpt, content_snippet (300 chars), article_category[], article_tags[], author, published_at, updated_at |
| `service-info` | objectID, type, slug, title, excerpt, content_snippet (300 chars), category, countries[], published_at, updated_at |
| `protection-info` | objectID, type, slug, title, content_snippet (300 chars), category, updated_at |
| `course` | objectID, type, slug, name, excerpt, description_snippet (300 chars), course_category, course_tags[], countries[], is_featured, published_at, updated_at |
| `content` | objectID, type, slug, title, excerpt, body_snippet (300 chars), content_group, published_at, updated_at |
| `country` | objectID, type, slug, name, description_snippet (300 chars), region, is_featured, updated_at |
| `persona` | objectID, type, slug, name, description_snippet (300 chars), updated_at |

## Key Design Decisions

- **Single index** with `type` field — unified search, frontend renders different card styles per type
- **`objectID` = Strapi `documentId`** — natural mapping
- **Relation facets stored as slug arrays** — filterable with `filterOnly()`
- **Truncated content only** — Rich text fields are HTML-stripped and truncated to ~300 chars as `*_snippet`. Full content is fetched from Strapi by the frontend when needed, not stored in Algolia. This keeps record sizes small and reduces Algolia costs.
- **HTML stripped via regex** — CKEditor stores `<p>` tags, no extra dependency needed
- **Draft handling** — `draftAndPublish: true` types only index when `publishedAt !== null`
- **Re-fetch on lifecycle events** — `event.result` doesn't include populated relations, must re-fetch with populate
- **Draft/publish hooks** — `afterPublish` indexes a record, `afterUnpublish` removes it from Algolia. `afterCreate` only indexes for `draftAndPublish: false` types (protection-info, country, persona). `draftAndPublish: true` types are only indexed on publish.
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

## Environment Variables

```
ALGOLIA_APPLICATION_ID=your-app-id
ALGOLIA_ADMIN_API_KEY=your-admin-key
ALGOLIA_SEARCH_API_KEY=your-search-only-key
ALGOLIA_INDEX_NAME=jari_pmi_dev
```

## Implementation Order

1. `npm install algoliasearch` + add env vars to `.env`
2. Create `src/algolia/client.ts`, `config.ts`, `utils.ts`
3. Create `src/algolia/transformers.ts`
4. Create `src/algolia/hooks.ts`
5. Create `src/algolia/indexer.ts`
6. Modify `src/index.ts` to register hooks on bootstrap
7. Create `src/api/search/` (schema, service, controller, routes)
8. Create `scripts/reindex.ts` + add npm script
9. Run initial reindex and test `/api/search`
10. Configure Algolia synonyms in dashboard (PMI ↔ Pekerja Migran Indonesia, TKI ↔ Tenaga Kerja Indonesia)