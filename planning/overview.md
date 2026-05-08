# JARI PMI - Strapi v5 CMS Planning

## Context

JARI PMI is a product/service landing page providing information for Indonesian migrant workers (PMI). The CMS backend uses Strapi v5 with PostgreSQL and Cloudinary, built from scratch. Pages no need to stored in strapi entities because it will handled by frontend.

## Tech Stack

| Layer | Choice |
|-------|--------|
| CMS | Strapi v5 (TypeScript) |
| Database | PostgreSQL |
| Media Storage | Cloudinary |
| Language | TypeScript |

## Pages Identified

7 page types. Personae (Calon PMI, PMI Aktif, Keluarga PMI, Purna PMI) are enum values within the Persona Page, not separate page types.

| # | Page Type | Route Pattern | Strapi Type | Personae |
|---|-----------|---------------|-------------|----------|
| 1 | Homepage | `/` | singleType `homepage` | — |
| 2 | Persona Page | `/<persona-slug>` | collection `persona-page` | 4 entries |
| 3 | Content Group Page | `/konten/:groupSlug` | collection `content-group` | — |
| 4 | Pelatihan Page | `/pelatihan` | frontend-driven | — |
| 5 | Pelatihan Detail Page | `/pelatihan/:slug` | collection `course` | — |
| 6 | List Artikel Page | `/artikel` | frontend-driven | — |
| 7 | Artikel Page | `/artikel/:slug` | collection `article` | — |

### 1. Homepage Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Hero | Headline, description, search placeholder, illustration | `homepage.hero` (section.hero) |
| Persona Modal | Modal title, text, 4 persona cards | `homepage.persona_modal_title/text`, `homepage.persona_cards` (section.persona-card) |
| Informasi Layanan | Section title + curated service cards | `homepage.service_section_title/desc`, `homepage.featured_services` → service-info |
| Negara Tujuan | Section title + curated country cards | `homepage.country_section_title`, `homepage.featured_countries` → country |
| Pelatihan | Section title + curated course cards | `homepage.training_section_title`, `homepage.featured_courses` → course |
| Artikel Terbaru | Section title + curated article cards | `homepage.article_section_title`, `homepage.featured_articles` → article |
| Layanan Pengaduan | Footer link to complaints | `global.external_links` (shared.link) |

### 2. Persona Page Sections

Each persona uses the same schema, with only name, image, background_color, and description stored in Strapi. Section content is assembled by the frontend from generic collections.

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Hero Menu Persona | Persona name, description, image, background_color | `persona-page` (name, description, image, background_color) |
| Content Group | Grouped content relevant to persona | `content-group` filtered by `personas` relation, items rendered by `content_type` |
| Penting Diketahui | Featured content entries | `content` entries with `is_featured: true` filtered by content-group |
| Alat Bantu | Feature/help cards | Frontend-driven (static or from `service-info`) |
| Negara Tujuan | Countries relevant to persona | `country` collection (is_featured or all) |
| Pelatihan | Courses relevant to persona | `course` collection filtered by `target_personas` |

### 3. Content Group Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Group Header | Group title, description, image | `content-group.title/slug/description/image` |
| Group Description | Intro text for the content group | `content-group.description` |
| Content Items | Items rendered based on `content_type` | `content_type` determines which relation: `contents`, `countries`, or `service_infos` |

### 4. Pelatihan Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Cari Pelatihan | Search bar and heading | Frontend static |
| Filter Pelatihan | Category, tag, country filters | `course-category`, `course-tag`, `country` collections |
| List Pelatihan | Course cards grid | `course` collection with filters |

### 5. Pelatihan Detail Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Title | Course name | `course.name` |
| Informasi Pelatihan | Price, platform, category | `course.price`, `course.learning_platform`, `course.course_category` |
| Deskripsi | Full description | `course.description` (richtext) |
| Kurikulum | Course content outline | `course.description` or dedicated field |

### 6. List Artikel Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Page Header | Title and description | Frontend static |
| Artikel Terbaru | Paginated article cards | `article` collection, sorted by published date |
| Filter | Category and tag filters | `article-category`, `article-tag` collections |

### 7. Artikel Page Sections

| Section | Content | Strapi Source |
|---------|---------|---------------|
| Cover | Cover image, category badge | `article.cover_image`, `article.article_category` |
| Title & Meta | Title, excerpt, author, date | `article.title/excerpt/author` |
| Content | Full article body | `article.content` (richtext) |
| Related Articles | Other articles in same category | `article` collection filtered by `article_category` |

### Supporting Collection Types

These are not standalone pages but provide entries consumed by the pages above.

| Collection | Used By | Notes |
|------------|---------|-------|
| `persona` | Persona Page | Persona identity (name, image, description, color) |
| `alert` | All pages | Site-wide alerts filtered by `pages` string field |
| `content-group` | Content Group Page, Persona Page | Groups items by type (content, country, service-info) |
| `content` | Content Group Page, Persona Page | Informational content entries (distinct from articles) |
| `country` | Homepage, Persona pages, Pelatihan page | Destination countries with flag, region |
| `article` | Homepage, List Artikel, Artikel | Articles with category, tags, author |
| `service-info` | Homepage (Informasi Layanan), Content Group | Service entries with cover image |
| `course` | Homepage, Persona pages, Pelatihan, Pelatihan Detail | Training courses with platform, price |
| `author` | Artikel page | Author bio and avatar |
| `article-category` | Artikel filtering | Categories for articles |
| `article-tag` | Artikel filtering | Tags for articles |
| `course-category` | Pelatihan, Pelatihan Detail | Categories for courses |
| `course-tag` | Pelatihan, Pelatihan Detail | Tags for courses |
| `learning-platform` | Pelatihan Detail | Platform provider for courses | 


## CMS vs Frontend Split

| CMS-Managed (Dynamic) | Frontend-Static |
|---|---|
| Hero headlines, descriptions, CTAs | Navbar layout, search UI behavior |
| Persona cards (title, desc, icon) | Modal open/close logic |
| Country entries, articles, courses | Card grid layouts, animations |
| Section titles per page | Section spacing, responsive breakpoints |
| Footer links, social links | Footer layout/styling |
| SEO metadata per page | Meta tag injection |
| Protection page tabs/accordions content | Tab switching, accordion behavior |

## Planning Documents

- [pages.md](./pages.md) - Pages mapping
- [entities.md](./entities.md) - Strapi entities (standalone vs collection)
