# JARI PMI — Strapi v5 CMS Technical Overview

## Context

JARI PMI is a product/service landing page providing information for Indonesian migrant workers (PMI). The CMS backend uses Strapi v5 with PostgreSQL, Redis, Cloudinary, and Algolia, built from scratch. Pages are handled by the frontend (not stored in Strapi entities).

## Tech Stack

| Layer | Choice |
|-------|--------|
| CMS | Strapi v5.43 (TypeScript) |
| Database | PostgreSQL |
| Cache | Redis (ioredis) |
| Media Storage | Cloudinary |
| Search | Algolia |
| Rich Text | CKEditor5 (GPL) |
| Language | TypeScript |

### Custom Infrastructure

| Layer | Files | Description |
|-------|-------|-------------|
| Redis Cache | `src/cache/` | Koa middleware — transparent GET caching (17 endpoints), auto-invalidation via lifecycle hooks |
| Algolia Search | `src/algolia/` | Unified search index (6 types), lifecycle hooks for auto-indexing, public proxy API |
| Popular Searches | `src/api/popular-searches/` | Redis sorted set tracking, top 5 API endpoint |

## Entities (23 Total)

| Type | Count | Names |
|------|-------|-------|
| Single Types | 2 | `global`, `homepage` |
| Collection Types | 21 | `persona`, `alert`, `country`, `service-info`, `content-group`, `content`, `article`, `article-category`, `article-tag`, `author`, `course`, `course-category`, `course-tag`, `learning-platform`, `course-learning-method`, `curriculum`, `announcement`, `faq`, `tool`, `province`, `purna-pmi` |
| Custom APIs (no schema) | 2 | `search` (Algolia proxy), `popular-searches` (Redis) |

> Full field definitions: see [entities.md](./entities.md)

## Components (10 Total)

| Category | Names |
|----------|-------|
| shared | `shared.seo`, `shared.link` |
| layout | `layout.footer-column`, `layout.social-link` |
| section | `section.hero`, `section.persona-card`, `section.step-item`, `section.feature-card`, `section.accordion-item`, `section.tab-panel` |

> 4 section components (`tab-panel`, `accordion-item`, `step-item`, `feature-card`) are defined but not yet referenced by any content type — ready for future use.

## Pages Identified

13 page types. Personae (Calon PMI, PMI Aktif, Keluarga PMI, Purna PMI) are entries within the `persona` collection, not separate page types.

| # | Page Type | Route Pattern | Data Source |
|---|-----------|---------------|-------------|
| 1 | Homepage | `/` | singleType `homepage` + `announcement` + `persona` |
| 2 | Persona Page | `/<persona-slug>` | collection `persona` + `content-group` + `country` + `course` + `tool` + `alert` |
| 3 | Content Group Page | `/konten/:groupSlug` | collection `content-group` + `content` |
| 4 | Content Group Detail (Country) | `/konten/:groupSlug?country=:slug` | collection `content-group` (filtered by country) |
| 5 | Informasi Keuangan Page | `/keuangan/:slug` | collection `service-info` |
| 6 | Informasi Keuangan Detail | `/keuangan/:slug?group=:slug` | collection `content-group` (filtered by service-info) |
| 7 | Pelatihan Page | `/pelatihan` | collection `course` + `course-category` + `course-tag` + `learning-platform` + `course-learning-method` |
| 8 | Pelatihan Detail Page | `/pelatihan/:slug` | collection `course` + `curriculum` |
| 9 | List Artikel Page | `/artikel` | collection `article` + `article-category` + `article-tag` |
| 10 | Artikel Page | `/artikel/:slug` | collection `article` |
| 11 | Negara Tujuan Page | `/negara-tujuan` | collection `country` |
| 12 | Negara Tujuan Detail Page | `/negara-tujuan/:slug` | collection `country` + `content-group` |
| 13 | Purna PMI Page | `/purna-pmi` | collection `purna-pmi` + `province` |
| 14 | FAQ Page | `/faq` | collection `faq` |

### Homepage Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Hero | Headline, description, search placeholder, illustration | `homepage.hero` (section.hero) |
| Persona Modal | Modal title, text, 4 persona cards | `homepage.persona_modal_title/text`, `homepage.persona_cards` (section.persona-card) |
| Informasi Layanan | Announcement slider with time-based scheduling | `announcement` (filtered by `start_date`/`end_date`, sorted by `order`) |
| Negara Tujuan | Section title + curated country cards | `homepage.country_section_title`, `homepage.featured_countries` → `country` |
| Pelatihan | Section title + curated course cards | `homepage.training_section_title`, `homepage.featured_courses` → `course` |
| Artikel Terbaru | Section title + curated article cards | `homepage.article_section_title`, `homepage.featured_articles` → `article` |
| Layanan Pengaduan | Footer link to complaints | `global.external_links` (shared.link) |

### Persona Page Sections

Each persona uses the same schema, stored in the `persona` collection. Section content is assembled by the frontend from generic collections.

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Hero Menu Persona | Persona banner_title, banner_subtitle, image, background_color | `persona` (banner_title, banner_subtitle, image, background_color) |
| Content Group | Grouped content relevant to persona | `content-group` filtered by `personas` relation |
| Penting Diketahui | Featured content entries | `content` entries with `is_featured: true` filtered by content-group |
| Alat Bantu | Tool/resource cards | `tool` filtered by `personas` relation |
| Negara Tujuan | Countries | `country` collection (all or is_featured) |
| Pelatihan | Courses | `course` collection (all or is_featured) |

### Pelatihan Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Cari Pelatihan | Search bar and heading | Frontend static |
| Filter Pelatihan | Category, tag, learning platform, learning method | `course-category`, `course-tag`, `learning-platform`, `course-learning-method` |
| List Pelatihan | Course cards grid with curriculum count | `course` collection with filters + `curriculum` relation |

### Pelatihan Detail Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Title & Meta | Course name, instructor, duration, platform | `course.name/instructor/course_duration/learning_platform` |
| Informasi Pelatihan | Price, final_price, category, tags, method | `course.price/final_price/course_category/course_tags/learning_method` |
| Deskripsi | Full description | `course.description` (richtext CKEditor5) |
| Kurikulum | Course curriculum modules | `curriculum` (title, content, duration, order) related to course |

### Purna PMI Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Filter Provinsi | Province dropdown | `province` (name, slug) |
| List Purna PMI | Business profile cards, filter by province | `purna-pmi` (brand, products, revenue, image, province) |

## CMS vs Frontend Split

| CMS-Managed (Dynamic) | Frontend-Static |
|---|---|
| Hero headlines, descriptions, CTAs | Navbar layout, search UI behavior |
| Persona cards (title, desc, icon) | Modal open/close logic |
| Country entries, articles, courses | Card grid layouts, animations |
| Section titles per page | Section spacing, responsive breakpoints |
| Footer links, social links | Footer layout/styling |
| SEO metadata per page | Meta tag injection |
| Tab/accordion content (via tab-panel component) | Tab switching, accordion behavior |
| Announcement slider (time-scheduled) | Slider carousel behavior |

## Draft/Publish Entities

7 of 24 entities support draft/publish workflow:

| Entity | Reason |
|--------|--------|
| `alert` | Time-sensitive, needs scheduling |
| `content-group` | Editorial review |
| `content` | Informational content review |
| `service-info` | Service entry accuracy |
| `article` | Editorial review |
| `course` | Course details accuracy |
| `purna-pmi` | Success story curation |

## Infrastructure Highlights

| Feature | Implementation |
|---------|---------------|
| **API Cache** | Redis middleware — 17 endpoints cached, TTL 300s–3600s, auto-invalidate on write |
| **Global Search** | Algolia single index — 6 searchable types, lifecycle hooks, public proxy API |
| **Popular Searches** | Redis sorted set — `/api/search/popular` returns top 5 |
| **Health Check** | `/health` — memory, disk, PostgreSQL connectivity |
| **Media Sanitization** | Cloudinary SVG auto-sanitize via `fl_sanitize/` URL patch |
| **CSP Security** | Custom Content-Security-Policy allowing Cloudinary, Redocly, unpkg |

## Planning Documents

- [entities.md](./entities.md) — Full Strapi entity definitions (2 single + 21 collection types + 10 components)
- [pages.md](./pages.md) — Page-to-API mapping per section
- [algolia-search.md](./algolia-search.md) — Algolia search implementation plan
- [redis-cache.md](./redis-cache.md) — Redis cache implementation plan
- [technical-doc.md](./technical-doc.md) — Comprehensive technical documentation
- [diagrams/](./diagrams/) — C4 architecture diagrams (context + container)
