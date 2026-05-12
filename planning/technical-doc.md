# JARI PMI — Technical Documentation

## 1. System Overview

**JARI PMI** is a CMS-driven information portal for Indonesian migrant workers (PMI). It serves 4 personae: **Calon PMI**, **PMI Aktif**, **Keluarga PMI**, and **Purna PMI**. Content is managed via Strapi Admin Panel and consumed by two frontends — a web app (Express.js + template engine) and a native Android app.

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| CMS | Strapi v5.43 (TypeScript) | Content modeling, REST API, admin panel |
| Database | PostgreSQL | Content persistence |
| Cache | Redis (ioredis) | API response caching + popular search tracking |
| Media | Cloudinary | Image upload, CDN delivery |
| Search | Algolia | Global full-text search across 6 content types |
| Rich Text | CKEditor5 (GPL) | WYSIWYG editor in admin panel |
| Monitoring | strapi-health-plugin | `/health` endpoint (memory, disk, DB) |

### Architecture Diagrams

- [System Context Diagram (C4 L1)](./diagrams/context-diagram.md)
- [Container Diagram (C4 L2)](./diagrams/container-diagram.md)

---

## 2. Architecture

### 2.1 Container Architecture

```
Pengguna ──→ Web Frontend (Express.js + Templates)
          ──→ Mobile App (Native Android)
                 │
                 ↓ REST API /api/*
           Strapi CMS v5
           ┌─────┼─────┐
           ↓     ↓     ↓
      PostgreSQL  Redis  Cloudinary  Algolia
```

### 2.2 Middleware Stack

```
strapi::logger
strapi::errors
strapi::security  (custom CSP: Cloudinary + Redocly + unpkg)
strapi::cors
strapi::poweredBy
strapi::query
strapi::body
strapi::session
./src/cache/middleware  (custom Redis cache — transparent GET caching)
strapi::favicon
strapi::public
```

### 2.3 Bootstrap Sequence (`src/index.ts`)

1. `register()` — Patches Cloudinary upload provider for SVG sanitization (`fl_sanitize/`)
2. Reset Content Manager layouts (if `RESET_LAYOUTS` env var set)
3. Run seeder (if `SEED=true`)
4. Run full Algolia reindex (if `REINDEX=true`)
5. Register Algolia lifecycle hooks (if Algolia env vars configured)
6. Register Redis cache invalidation hooks (if Redis env vars configured)

### 2.4 Custom Infrastructure

#### Algolia Search

- **Single unified index** (`ALGOLIA_INDEX_NAME`) with `type` facet
- **6 searchable types**: `article`, `service-info`, `course`, `content`, `country`, `persona`
- **Lifecycle hooks**: `afterCreate`/`afterUpdate`/`afterDelete` for auto-indexing
- **Draft handling**: `draftAndPublish: true` types only indexed when `publishedAt !== null`
- **Content truncation**: Rich text HTML-stripped and truncated to ~300 chars per `*_snippet` field
- **Public proxy**: `GET /api/search` uses search-only API key server-side, no auth required
- **Files**: `src/algolia/{client,config,hooks,indexer,transformers,utils}.ts`

#### Redis API Cache

- **Middleware approach**: Koa middleware intercepts `GET /api/*` requests
- **17 cached endpoints** with per-type TTLs (5min for alerts → 1h for reference data)
- **Invalidation**: Lifecycle hooks clear self + related cache keys on any write
- **Cache-aside**: Redis failure never breaks the app — falls through to database
- **Key format**: `jari-pmi:cache:{contentType}:{list|detail}:{slug|queryHash}`
- **Header**: Responses include `X-Cache: HIT` or `X-Cache: MISS`
- **Skipped**: `/api/search`, `/admin/*`, auth routes, non-GET methods
- **Files**: `src/cache/{client,config,hooks,index,invalidation,keys,middleware}.ts`

#### Popular Searches

- **Redis sorted set**: Tracks search query frequency
- **Endpoint**: `GET /api/search/popular` — returns top 5 searches
- **Integration**: Search controller writes queries to Redis on each search request

### 2.5 Rich Text (CKEditor5)

Custom HTML preset in `src/admin/app.tsx` with 30+ plugins:
- Essentials: heading, bold, italic, underline, strikethrough, blockQuote, link
- Lists: bulletedList, numberedList, todoList
- Media: image, imageInsert via Strapi media library, mediaEmbed
- Structure: table, tableProperties, tableCellProperties, horizontalLine
- Editing: sourceEditing, codeBlock, findAndReplace, removeFormat
- Advanced: autoformat, specialCharacters, wordCount, alignment, indent

---

## 3. Single Types

### 3.1 `global` — Site Configuration

**Endpoint**: `GET /api/global` (custom controller, `auth: false`, deep populate)

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| `site_name` | string | yes | — | |
| `site_description` | text | no | — | |
| `logo` | media | yes | — | images only |
| `nav_links` | component (`shared.link`) | no | yes | Main navigation items |
| `external_links` | component (`shared.link`) | no | yes | SISKOP2MI, Pengaduan, etc. |
| `footer_columns` | component (`layout.footer-column`) | no | yes | |
| `social_links` | component (`layout.social-link`) | no | yes | |
| `copyright_text` | string | no | — | |
| `default_seo` | component (`shared.seo`) | no | — | Fallback SEO metadata |

**Options**: `draftAndPublish: false`

### 3.2 `homepage` — Homepage Editorial

**Endpoint**: `GET /api/homepage` (custom controller, `auth: false`, deep populate)

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| `hero` | component (`section.hero`) | yes | no | Headline, highlighted_text, description, search_placeholder, illustration |
| `persona_modal_title` | string | no | — | e.g. "Informasi PMI" |
| `persona_modal_text` | text | no | — | Modal intro text |
| `persona_cards` | component (`section.persona-card`) | no | yes | 4 persona entries |
| `service_section_title` | string | no | — | |
| `service_section_desc` | text | no | — | |
| `featured_services` | relation (OTM) | no | — | → `api::service-info.service-info` |
| `country_section_title` | string | no | — | |
| `featured_countries` | relation (OTM) | no | — | → `api::country.country` |
| `training_section_title` | string | no | — | |
| `featured_courses` | relation (OTM) | no | — | → `api::course.course` |
| `article_section_title` | string | no | — | |
| `featured_articles` | relation (OTM) | no | — | → `api::article.article` |
| `meta_seo` | component (`shared.seo`) | no | — | |

**Options**: `draftAndPublish: false`

---

## 4. Collection Types

### 4.1 `persona` — Persona Identity

4 entries only: calon-pmi, pmi-aktif, keluarga-pmi, purna-pmi.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | e.g. "Calon PMI" |
| `slug` | uid (name) | yes | |
| `banner_title` | string | no | Persona page hero headline |
| `banner_subtitle` | string | no | Persona page hero sub-headline |
| `excerpt` | text | yes | Short description for cards |
| `description` | CKEditor5 | no | Full persona description |
| `image` | media | yes | Persona illustration/icon |
| `background_color` | string | no | Hex color for persona theme |
| `order` | integer | no | default: 0 |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: false`
**Collection name**: `personas`

### 4.2 `alert` — Site-wide Alert Banners

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | enum | yes | `info`, `warning`, `success`, `error` |
| `title` | string | yes | |
| `message` | CKEditor5 | yes | Alert body |
| `icon` | media | no | Alert icon |
| `image` | media | no | Alert image |
| `link` | string | no | Optional CTA link |
| `personas` | relation (M2M) | no | → `api::persona.persona` |
| `active` | boolean | no | default: true |
| `start_date` | datetime | no | Scheduling start |
| `end_date` | datetime | no | Scheduling end |

**Options**: `draftAndPublish: true`
**Collection name**: `alerts`

> **Note**: Alerts target specific personas via M2M relation. The `page` entity previously used for alert targeting has been removed.

### 4.3 `country` — Destination Countries

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `excerpt` | text | no | Short description for cards |
| `description` | CKEditor5 | no | Full country description |
| `flag` | media | yes | Country flag image |
| `image` | media | no | Card/hero image |
| `region` | enum | no | `asia`, `middle-east`, `europe`, `africa`, `americas`, `oceania` |
| `is_featured` | boolean | no | default: false |
| `order` | integer | no | default: 0 |
| `vacancy_count` | integer | no | |
| `salary_avg` | text | no | |
| `pmi_count` | integer | no | |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: false`
**Collection name**: `countries`

### 4.4 `service-info` — Service/Layanan Entries

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | |
| `slug` | uid (name) | yes | |
| `excerpt` | text | no | Short summary for cards |
| `description` | CKEditor5 | yes | Full content |
| `image` | media | yes | Cover image |
| `countries` | relation (M2M) | no | → `api::country.country` |
| `link` | string | no | External or internal URL |
| `is_featured` | boolean | no | default: false |
| `order` | integer | no | default: 0 |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: true`
**Collection name**: `service_infos`

### 4.5 `content-group` — Themed Content Groups

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | unique |
| `slug` | uid (title) | yes | |
| `description` | CKEditor5 | no | Group intro text |
| `image` | media | no | Group cover image |
| `icon` | media | no | Group icon |
| `countries` | relation (M2M) | no | → `api::country.country` |
| `service_infos` | relation (M2M) | no | → `api::service-info.service-info` |
| `personas` | relation (M2M) | no | → `api::persona.persona` |
| `order` | integer | no | default: 0 |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: true`
**Collection name**: `content_groups`

> **Note**: Multiple parallel relation fields replace the earlier `content_type` enum design. The frontend uses whichever relation is populated. A group can reference countries, service-infos, or personas simultaneously.

### 4.6 `content` — Informational Content Entries

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `slug` | uid (title) | yes | |
| `excerpt` | text | no | Short summary for cards |
| `body` | CKEditor5 | yes | Full content |
| `image` | media | no | Cover/icon image |
| `icon` | media | no | Icon image |
| `link` | string | no | Optional external URL |
| `content_group` | relation (MTO) | no | → `api::content-group.content-group` |
| `order` | integer | no | default: 0 |
| `is_featured` | boolean | no | default: false |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: true`
**Collection name**: `contents`

### 4.7 `article` — News & Articles

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | unique |
| `slug` | uid (title) | yes | |
| `excerpt` | text | yes | Short summary for cards |
| `content` | CKEditor5 | yes | Full article body |
| `cover_image` | media | yes | |
| `article_category` | relation (MTO) | no | → `api::article-category.article-category` |
| `article_tags` | relation (M2M) | no | → `api::article-tag.article-tag` |
| `author` | relation (MTO) | no | → `api::author.author` |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: true`
**Collection name**: `articles`

### 4.8 `article-category` — Article Categories

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `description` | CKEditor5 | no | |
| `image` | media | no | Category image |
| `articles` | relation (OTM) | no | ← `api::article.article` (mappedBy: article_category) |

**Options**: `draftAndPublish: false`
**Collection name**: `article_categories`

### 4.9 `article-tag` — Article Tags

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `articles` | relation (M2M) | no | ← `api::article.article` (mappedBy: article_tags) |

**Options**: `draftAndPublish: false`
**Collection name**: `article_tags`

### 4.10 `author` — Article Authors

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `avatar` | media | no | |
| `bio` | text | no | |
| `articles` | relation (OTM) | no | ← `api::article.article` (mappedBy: author) |

**Options**: `draftAndPublish: false`
**Collection name**: `authors`

### 4.11 `course` — Training/Pelatihan

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `excerpt` | text | no | Short summary for cards |
| `description` | CKEditor5 | no | Full description |
| `image` | media | yes | |
| `price` | decimal | no | Original price |
| `final_price` | decimal | no | Discounted price |
| `link` | string | yes | External enrollment URL |
| `instructor` | string | no | Instructor name |
| `course_duration` | string | no | e.g. "8 Minggu" |
| `course_category` | relation (MTO) | no | → `api::course-category.course-category` |
| `course_tags` | relation (M2M) | no | → `api::course-tag.course-tag` |
| `learning_platform` | relation (MTO) | no | → `api::learning-platform.learning-platform` |
| `learning_method` | relation (MTO) | no | → `api::course-learning-method.course-learning-method` |
| `curriculums` | relation (OTM) | no | ← `api::curriculum.curriculum` (mappedBy: course) |
| `is_featured` | boolean | no | default: false |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: true`
**Collection name**: `courses`

### 4.12 `course-category` — Course Categories

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `courses` | relation (OTM) | no | ← `api::course.course` (mappedBy: course_category) |

**Options**: `draftAndPublish: false`
**Collection name**: `course_categories`

### 4.13 `course-tag` — Course Tags

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `courses` | relation (M2M) | no | ← `api::course.course` (mappedBy: course_tags) |

**Options**: `draftAndPublish: false`
**Collection name**: `course_tags`

### 4.14 `learning-platform` — Training Providers

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `logo` | media | no | |
| `url` | string | no | Platform website |
| `courses` | relation (OTM) | no | ← `api::course.course` (mappedBy: learning_platform) |

**Options**: `draftAndPublish: false`
**Collection name**: `learning_platforms`

### 4.15 `course-learning-method` — Learning Methods

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `courses` | relation (OTM) | no | ← `api::course.course` (mappedBy: learning_method) |

**Options**: `draftAndPublish: false`
**Collection name**: `course_learning_methods`

### 4.16 `curriculum` — Course Curriculum Items

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | Module/section title |
| `content` | CKEditor5 | no | Module description |
| `duration` | integer | no | default: 0 (minutes) |
| `order` | integer | no | default: 0 |
| `course` | relation (MTO) | no | → `api::course.course` |

**Options**: `draftAndPublish: false`
**Collection name**: `curriculums`

### 4.17 `announcement` — Homepage Announcement Slider

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `excerpt` | text | no | |
| `description` | CKEditor5 | yes | Full announcement content |
| `image` | media | yes | |
| `link` | string | yes | CTA link |
| `start_date` | datetime | yes | Display start |
| `end_date` | datetime | no | Display end |
| `personas` | relation (M2M) | no | → `api::persona.persona` |
| `order` | integer | no | default: 0 |

**Options**: `draftAndPublish: false`
**Collection name**: `announcements`

### 4.18 `faq` — Frequently Asked Questions

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | Question |
| `content` | CKEditor5 | yes | Answer |
| `faq_category` | relation (MTO) | no | → `api::faq-category.faq-category` |
| `order` | integer | no | default: 0 |

**Options**: `draftAndPublish: false`
**Collection name**: `faqs`

### 4.19 `faq-category` — FAQ Categories

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `order` | integer | no | default: 0 |
| `faqs` | relation (OTM) | no | ← `api::faq.faq` (mappedBy: faq_category) |

**Options**: `draftAndPublish: false`
**Collection name**: `faq_categories`

> **Pattern**: Same as `article-category`/`course-category`. Groups FAQs into collapsible sections (e.g. "Tentang Jari PMI", "Pendaftaran", "Pelatihan").

### 4.20 `tool` — Helpful Resources

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Tool/resource name |
| `description` | CKEditor5 | no | |
| `link` | string | no | |
| `logo` | media | no | |
| `personas` | relation (M2M) | no | → `api::persona.persona` |

**Options**: `draftAndPublish: false`
**Collection name**: `tools`

### 4.21 `province` — Province Reference Data

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | unique |
| `slug` | uid (name) | yes | |
| `image` | media | no | |
| `is_featured` | boolean | no | default: false |
| `order` | integer | no | default: 0 |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: false`
**Collection name**: `provinces`

### 4.22 `purna-pmi` — Purna PMI Success Stories

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | yes | Business/person name |
| `slug` | uid (name) | yes | |
| `brand` | string | no | |
| `business_type` | string | no | |
| `products` | string | no | |
| `revenue` | string | no | |
| `employee_count` | string | no | |
| `production_capacity` | string | no | |
| `year_established` | integer | no | |
| `legal_entity` | string | no | |
| `city` | string | no | |
| `contact` | string | no | |
| `marketing_channels` | enum | no | `Retail`, `Online`, `Ekspor` |
| `province` | relation (MTO) | no | → `api::province.province` |
| `image` | media | no | |
| `is_featured` | boolean | no | default: false |
| `order` | integer | no | default: 0 |
| `meta_seo` | component (`shared.seo`) | no | |

**Options**: `draftAndPublish: true`
**Collection name**: `purna_pmis`

## 5. Components

### 5.1 `shared.seo` — SEO Metadata

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `meta_title` | string | yes | |
| `meta_description` | text | yes | |
| `meta_keywords` | string | no | |
| `share_image` | media | no | OG/Twitter image |
| `canonical_url` | string | no | |

### 5.2 `shared.link` — Generic Link

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `label` | string | yes | Link text |
| `url` | string | yes | |
| `is_external` | boolean | no | default: false |

**Used by**: `global.nav_links`, `global.external_links`, `layout.footer-column.links`, `section.feature-card.link`

### 5.3 `layout.footer-column` — Footer Column

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| `heading` | string | yes | — | Column heading |
| `links` | component (`shared.link`) | no | yes | Column links |

### 5.4 `layout.social-link` — Social Media Link

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `platform` | enum | yes | `facebook`, `twitter`, `instagram`, `youtube`, `tiktok`, `linkedin` |
| `url` | string | yes | |

### 5.5 `section.hero` — Hero Section

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `headline` | string | yes | Main hero text |
| `highlighted_text` | string | no | Accent/colored text |
| `description` | text | no | Subheadline |
| `search_placeholder` | string | no | Search bar placeholder text |
| `illustration` | media | no | Hero image |

**Used by**: `homepage.hero`

### 5.6 `section.persona-card` — Persona Selector Card

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | Persona name |
| `description` | text | yes | Persona short description |
| `icon` | media | no | Persona icon |
| `slug` | string | yes | Routes to `/<slug>` |

**Used by**: `homepage.persona_cards`

### 5.7 `section.step-item` — Step/Instruction Item

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `step_number` | integer | yes | |
| `title` | string | yes | |
| `description` | text | no | |
| `icon` | media | no | |

**Status**: Defined, not yet referenced by any content type.

### 5.8 `section.accordion-item` — Accordion Item

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | Accordion header |
| `content` | richtext | yes | Accordion body |

**Status**: Defined, not yet referenced by any content type.

### 5.9 `section.tab-panel` — Tab Panel

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| `tab_label` | string | yes | — | Tab button text |
| `tab_slug` | string | yes | — | Tab anchor |
| `content` | richtext | no | — | Tab body |
| `accordions` | component (`section.accordion-item`) | no | yes | Nested accordions |
| `steps` | component (`section.step-item`) | no | yes | Nested steps |

**Status**: Defined, not yet referenced by any content type.

### 5.10 `section.feature-card` — Feature Card

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | |
| `description` | text | no | |
| `icon` | media | no | |
| `image` | media | no | |
| `link` | component (`shared.link`) | no | CTA link |

**Status**: Defined, not yet referenced by any content type.

---

## 6. API Reference

### 6.1 Strapi REST Conventions

| Feature | Pattern |
|---------|---------|
| List | `GET /api/{collection}?populate=*&sort=order:asc&status=published` |
| Detail | `GET /api/{collection}/{documentId}?populate=*` |
| Filter | `?filters[{field}][{operator}]={value}` |
| Pagination | `?pagination[page]=1&pagination[pageSize]=25` (default 25, max 100) |
| Sort | `?sort=createdAt:desc` or `?sort=order:asc,name:asc` |

### 6.2 Custom API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/global` | public | Site configuration with deep populate |
| `GET` | `/api/homepage` | public | Homepage editorial with deep populate |
| `GET` | `/api/search?q={query}` | public | Algolia search proxy |
| `GET` | `/api/search?q={query}&type=article` | public | Filtered search by content type |
| `GET` | `/api/search?q={query}&type=article,service-info` | public | Multi-type search |
| `GET` | `/api/search?q={query}&region=asia` | public | Faceted search |
| `GET` | `/api/search?q={query}&page=2&hitsPerPage=10` | public | Paginated search |
| `GET` | `/api/search/popular` | public | Top 5 searches from Redis |
| `GET` | `/health` | public | Health check (memory, disk, DB) |

### 6.3 Search API Response

```json
{
  "data": {
    "hits": [
      {
        "objectID": "abc123",
        "type": "article",
        "slug": "panduan-lengkap",
        "title": "Panduan Lengkap Menjadi PMI",
        "excerpt": "Ketahui langkah-langkah penting...",
        "content_snippet": "Menjadi Pekerja Migran Indonesia...",
        "article_category": ["perlindungan"],
        "article_tags": ["migrasi", "hukum"],
        "author": ["admin"],
        "published_at": 1745800000,
        "updated_at": 1745800000
      }
    ],
    "nbHits": 42,
    "page": 0,
    "nbPages": 5,
    "hitsPerPage": 10,
    "query": "pmi",
    "facets": { "type": { "article": 12, "service-info": 8 } }
  }
}
```

### 6.4 Redis Cache Coverage

| Endpoint | TTL | Type |
|----------|-----|------|
| `GET /api/global` | 3600s | Single |
| `GET /api/homepage` | 3600s | Single |
| `GET /api/articles` | 600s | List |
| `GET /api/courses` | 600s | List |
| `GET /api/countries` | 3600s | List |
| `GET /api/faqs` | 3600s | List |
| `GET /api/service-infos` | 600s | List |
| `GET /api/personas` | 3600s | List |
| `GET /api/content-groups` | 600s | List |
| `GET /api/contents` | 600s | List |
| `GET /api/alerts` | 300s | List |
| `GET /api/article-categories` | 3600s | List |
| `GET /api/article-tags` | 3600s | List |
| `GET /api/course-categories` | 3600s | List |
| `GET /api/course-tags` | 3600s | List |
| `GET /api/learning-platforms` | 3600s | List |
| `GET /api/authors` | 3600s | List |

> Detail paths (e.g. `/api/articles/:slug`) use the same TTL as their list counterpart.

### 6.5 Cache Invalidation Map

| UID | Invalidate Self | Invalidate Related |
|-----|----------------|-------------------|
| `api::article.article` | `articles:*` | `homepage` |
| `api::service-info.service-info` | `service-infos:*` | `homepage` |
| `api::course.course` | `courses:*` | `homepage` |
| `api::content.content` | `contents:*` | `content-groups:*` |
| `api::content-group.content-group` | `content-groups:*` | — |
| `api::country.country` | `countries:*` | `courses:list:*`, `service-infos:list:*` |
| `api::faq.faq` | `faqs:*` | — |
| `api::persona.persona` | `personas:*` | `content-groups:*` |
| `api::alert.alert` | `alerts:*` | `global` |
| `api::article-category.*` | `article-categories:*` | `articles:*` |
| `api::article-tag.*` | `article-tags:*` | `articles:*` |
| `api::course-category.*` | `course-categories:*` | `courses:*` |
| `api::course-tag.*` | `course-tags:*` | `courses:*` |
| `api::learning-platform.*` | `learning-platforms:*` | `courses:*` |
| `api::author.author` | `authors:*` | `articles:*` |
| `api::global.global` | `global` | — |
| `api::homepage.homepage` | `homepage` | — |

### 6.6 Algolia Searchable Types

| Type | UID | Title Field | Text Field | Facets |
|------|-----|-------------|------------|--------|
| `article` | `api::article.article` | title | content | article_category, article_tags, author |
| `service-info` | `api::service-info.service-info` | name | description | countries |
| `course` | `api::course.course` | name | description | course_category, course_tags |
| `content` | `api::content.content` | title | body | content_group |
| `country` | `api::country.country` | name | description | region |
| `persona` | `api::persona.persona` | name | description | — |

---

## 7. Environment Variables

### 7.1 Strapi Core

```bash
NODE_ENV=development
HOST=0.0.0.0
PORT=1337
APP_KEYS=generate-with-strapi
API_TOKEN_SALT=generate-with-strapi
ADMIN_JWT_SECRET=generate-with-strapi
TRANSFER_TOKEN_SALT=generate-with-strapi
JWT_SECRET=generate-with-strapi
URL=http://localhost:1337
ADMIN_URL=/admin
```

### 7.2 PostgreSQL

```bash
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/jari_pmi
# OR individual params:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=jari_pmi
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-database-password
DATABASE_SSL=false
```

### 7.3 Redis

```bash
REDIS_URL=redis://localhost:6379
# OR individual params:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_ENABLED=true
REDIS_CACHE_PREFIX=jari-pmi:cache:
```

### 7.4 Cloudinary

```bash
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret
```

### 7.5 Algolia

```bash
ALGOLIA_APPLICATION_ID=your-algolia-app-id
ALGOLIA_ADMIN_API_KEY=your-algolia-admin-key
ALGOLIA_SEARCH_API_KEY=your-algolia-search-key
ALGOLIA_INDEX_NAME=jari_pmi_dev
```

---

## 8. Authentication

### 8.1 Admin

Strapi Admin Panel uses JWT authentication via `@strapi/admin`. Admin users are managed through the Admin Panel itself.

### 8.2 Public API

The following routes are exposed **without authentication** (`auth: false`):

| Route | Reason |
|-------|--------|
| `GET /api/global` | Public site config |
| `GET /api/homepage` | Public homepage content |
| `GET /api/search` | Public search proxy |
| `GET /api/search/popular` | Public popular searches |
| `GET /api/{collection}` | Default Strapi public API |
| `GET /api/{collection}/{id}` | Default Strapi public API |
| `GET /health` | Health check |

### 8.3 API Tokens

API tokens can be generated via Strapi Admin Panel → Settings → API Tokens for authenticated access to admin-only endpoints if needed.

### 8.4 Role-Based Access

- **Public role**: Has `find` and `findOne` permissions on all content types
- **Authenticated role**: Not used (no end-user auth)
- Content creation/update/delete is Admin Panel only

---

## 9. Error Handling

### 9.1 Strapi Default Errors

Strapi returns standard HTTP error responses:

```json
{
  "data": null,
  "error": {
    "status": 404,
    "name": "NotFoundError",
    "message": "Not Found",
    "details": {}
  }
}
```

### 9.2 Redis Cache Fallback

The Redis cache middleware follows **cache-aside** pattern:

| Scenario | Behavior |
|----------|----------|
| Redis unavailable at startup | Middleware logs warning, all requests fall through to database |
| Redis connection lost mid-request | Treated as cache MISS, continues to controller |
| Redis write error | Log warning, response returned normally (not cached) |
| Redis reconnects | Auto-reconnect via `ioredis` built-in retry |
| `REDIS_CACHE_ENABLED=false` | Middleware becomes a no-op |

### 9.3 Algolia Fallback

| Scenario | Behavior |
|----------|----------|
| Algolia env vars not set | Hooks never registered, `/api/search` returns empty results |
| Algolia search error | Controller catches error, returns `{ hits: [], nbHits: 0 }` |
| Indexing hook error | Logged and swallowed — does not block Strapi CRUD |

---

## 10. Draft/Publish Workflow

### 10.1 Entities with Draft/Publish

Only 7 of 24 entities use `draftAndPublish: true`:

| Entity | Reason |
|--------|--------|
| `content-group` | Editorial review before publishing |
| `purna-pmi` | Success story curation |
| `alert` | Time-sensitive, needs scheduling control |
| `content` | Informational content review |
| `service-info` | Service entry accuracy |
| `course` | Course details accuracy |
| `article` | Editorial review |

### 10.2 Implications

| System | Behavior for Draft |
|--------|-------------------|
| **Algolia indexing** | Only indexes when `publishedAt !== null` |
| **Redis cache** | Invalidation fires on `afterPublish`/`afterUnpublish` hooks |
| **Public API** | `?status=published` filter excludes drafts |

---

## 11. Development

### 11.1 Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build admin panel |
| `npm start` | Build + generate OpenAPI docs + start |
| `npm run seed` | Run database seeder |
| `npm run reindex` | Full Algolia reindex |
| `npm run generate:docs` | Generate OpenAPI spec |
| `npm run test:apis` | Test API endpoints |
| `npm run fix:svg-cloudinary` | Patch SVG Cloudinary URLs |

### 11.2 Configuration Files

| File | Purpose |
|------|---------|
| `config/server.ts` | Host, port, app keys |
| `config/database.ts` | PostgreSQL with pooling (min 2, max 10), SSL support |
| `config/admin.ts` | Admin JWT secret, API token salt, feature flags |
| `config/api.ts` | REST API defaults (limit 25, max 100, withCount) |
| `config/plugins.ts` | Cloudinary upload, CKEditor5, Health |
| `config/middlewares.ts` | Middleware stack including CSP + cache middleware |
| `config/env/staging/*` | Staging overrides (proxy, flags) |
| `config/env/production/*` | Production overrides (proxy, flags) |

---

## 12. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@strapi/strapi` | 5.43.0 | CMS core |
| `@strapi/plugin-users-permissions` | 5.43.0 | Auth plugin |
| `@strapi/plugin-cloud` | 5.43.0 | Cloud plugin |
| `@strapi/provider-upload-cloudinary` | ^5.43.0 | Media upload |
| `@_sh/strapi-plugin-ckeditor` | ^7.1.1 | CKEditor5 integration |
| `algoliasearch` | ^5.51.0 | Search engine |
| `ioredis` | ^5.10.1 | Redis client |
| `pg` | ^8.20.0 | PostgreSQL driver |
| `strapi-health-plugin` | ^1.2.2 | Health check |

---

## 13. Deployment

Deployment is platform-agnostic (VPS, Railway, or any Docker-capable host).

### Requirements

- **Node.js**: >=20.0.0 <=24.x.x
- **PostgreSQL**: >=14
- **Redis**: >=6
- **Cloudinary** account
- **Algolia** account

### Key Considerations

- `src/cache/middleware` gracefully degrades if Redis unavailable
- `src/algolia/hooks` only activate when Algolia env vars are set
- Cloudinary SVG sanitization patched automatically at `register()` time
- Content Manager layouts reset automatically on bootstrap (configurable)
- Production CSP allows: `res.cloudinary.com`, `cdn.redoc.ly`, `unpkg.com`
