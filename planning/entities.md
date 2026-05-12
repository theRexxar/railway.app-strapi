# Strapi Entities

Pages are handled by the frontend. Strapi stores only the dynamic data those pages consume.

## Standalone (singleType)

### 1. `global`

Site-wide config: navbar, footer, social links, default SEO. **Read-only via API** (`GET /api/global` only, `auth: false`). Edits via admin panel.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| site_name | string | yes | — | |
| site_description | text | no | — | |
| logo | media (single, images) | yes | — | |
| nav_links | component (shared.link) | no | yes | Main nav items |
| external_links | component (shared.link) | no | yes | SISKOP2MI, Pengaduan |
| footer_columns | component (layout.footer-column) | no | yes | |
| social_links | component (layout.social-link) | no | yes | |
| copyright_text | string | no | — | |
| default_seo | component (shared.seo) | no | — | Fallback SEO |

### 2. `homepage`

Homepage editorial: hero content, persona modal, curated featured items per section. **Read-only via API** (`GET /api/homepage` only, `auth: false`). Edits via admin panel.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| hero | component (section.hero) | yes | no | Non-repeatable |
| persona_modal_title | string | no | — | e.g. "Informasi PMI" |
| persona_modal_text | text | no | — | e.g. "Halo sobat migran, pilih profil kamu..." |
| persona_cards | component (section.persona-card) | no | yes | 4 persona entries |
| service_section_title | string | no | — | e.g. "Informasi Layanan PMI Terbaru" |
| service_section_desc | text | no | — | |
| featured_services | relation (OTM) | no | — | → service-info |
| country_section_title | string | no | — | e.g. "Negara Tujuan" |
| featured_countries | relation (OTM) | no | — | → country |
| training_section_title | string | no | — | e.g. "Pelatihan Bersertifikat" |
| featured_courses | relation (OTM) | no | — | → course |
| article_section_title | string | no | — | e.g. "Artikel Dan Berita Terbaru" |
| featured_articles | relation (OTM) | no | — | → article |
| meta_seo | component (shared.seo) | no | — | |

---

## Collection (collectionType)

Each creates full CRUD API endpoints. All use `GET /api/{pluralName}` naming.

### 1. `persona`

One entry per persona. Lightweight — stores persona identity + hero data. Section content is assembled by the frontend from generic collections.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | e.g. "Calon PMI" |
| slug | uid (targetField: name) | yes | — | |
| banner_title | string | no | — | Persona page hero headline |
| banner_subtitle | string | no | — | Persona page hero sub-headline |
| excerpt | text | yes | — | Short description for cards |
| description | richtext (CKEditor5) | no | — | Full persona description |
| image | media (single, images) | yes | — | Persona illustration/icon |
| background_color | string | no | — | Hex color for persona theme |
| order | integer | no | — | default: 0, for manual sorting |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: false` — Collection name: `personas`

### 2. `alert`

Site-wide alert banners. Shown on pages selected via the `pages` relation.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| type | enumeration | yes | — | info, warning, success, error |
| title | string | yes | — | Alert title |
| message | richtext (CKEditor5) | yes | — | Alert body |
| icon | media (single, images) | no | — | Alert icon |
| image | media (single, images) | no | — | Alert image |
| link | string | no | — | Optional CTA link |
| personas | relation (M2M) | no | — | → persona (which personas see this alert) |
| active | boolean | no | — | default: true, to toggle visibility |
| start_date | datetime | no | — | Scheduling start |
| end_date | datetime | no | — | Scheduling end |

`draftAndPublish: true` — Collection name: `alerts`

> **Changed from planning**: `pages` (string) replaced with `personas` M2M relation to target specific personas.

### 3. `country`

Destination countries for migrant workers. Shared across Homepage, Persona Page, Pelatihan.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| excerpt | text | no | — | Short description for cards |
| description | richtext (CKEditor5) | no | — | Full description |
| flag | media (single, images) | yes | — | Country flag |
| image | media (single, images) | no | — | Card/hero image |
| region | enumeration | no | — | asia, middle-east, europe, africa, americas, oceania |
| is_featured | boolean | no | — | default: false |
| order | integer | no | — | default: 0, for manual sorting |
| meta_seo | component (shared.seo) | no | — | |
| vacancy_count | integer | no | — | |
| salary_avg | text | no | — | |
| pmi_count | integer | no | — | |

`draftAndPublish: false` — Collection name: `countries`

### 4. `service-info`

Service/layanan entries (e.g. QRIS Cross Border). Displayed on Homepage Informasi Layanan section and Content Groups.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | |
| slug | uid (targetField: name) | yes | — | |
| excerpt | text | no | — | Short summary for cards |
| description | richtext (CKEditor5) | yes | — | Full content |
| image | media (single, images) | yes | — | Cover image |
| countries | relation (M2M) | no | — | → country (for flags) |
| link | string | no | — | External or internal URL |
| is_featured | boolean | no | — | default: false |
| order | integer | no | — | default: 0 |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true` — Collection name: `service_infos`

> **Changed from planning**: Field `title` renamed to `name`. Removed `category` string field.

### 5. `content-group`

Groups content under a themed section. Used on Persona Page and Content Group Page (`/konten/:groupSlug`).

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | unique |
| slug | uid (targetField: title) | yes | — | |
| description | richtext (CKEditor5) | no | — | Group intro text |
| image | media (single, images) | no | — | Group cover image |
| icon | media (single, images) | no | — | Group icon |
| countries | relation (M2M) | no | — | → country |
| service_infos | relation (M2M) | no | — | → service-info |
| personas | relation (M2M) | no | — | → persona (which personas show this group) |
| order | integer | no | — | default: 0 |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true` — Collection name: `content_groups`

> **Changed from planning**: Removed `content_type` enum pattern. Now uses parallel relation fields — a group can simultaneously reference countries, service-infos, and personas. The frontend renders whichever relations are populated.

### 6. `content`

Individual content entries within a content group. Generic informational content (tips, guides, highlights) — distinct from news articles.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | |
| slug | uid (targetField: title) | yes | — | |
| excerpt | text | no | — | Short summary for cards |
| body | richtext (CKEditor5) | yes | — | Full content |
| image | media (single, images) | no | — | Cover image |
| icon | media (single, images) | no | — | Icon image |
| link | string | no | — | Optional external URL |
| content_group | relation (MTO) | no | — | → content-group |
| order | integer | no | — | default: 0, for sorting within group |
| is_featured | boolean | no | — | default: false |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true` — Collection name: `contents`

### 7. `article`

News and informational articles. Used on Homepage, List Artikel, Artikel Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | unique |
| slug | uid (targetField: title) | yes | — | |
| excerpt | text | yes | — | Short summary for cards |
| content | richtext (CKEditor5) | yes | — | Full article body |
| cover_image | media (single, images) | yes | — | |
| article_category | relation (MTO) | no | — | → article-category |
| article_tags | relation (M2M) | no | — | → article-tag |
| author | relation (MTO) | no | — | → author |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true` — Collection name: `articles`

### 8. `article-category`

Article categories for organizing and filtering articles.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| description | richtext (CKEditor5) | no | — | |
| image | media (single, images) | no | — | Category image |
| articles | relation (OTM) | no | — | ← article (mappedBy: article_category) |

`draftAndPublish: false` — Collection name: `article_categories`

### 9. `article-tag`

Article tags for filtering on List Artikel and Artikel Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| articles | relation (M2M) | no | — | ← article (mappedBy: article_tags) |

`draftAndPublish: false` — Collection name: `article_tags`

### 10. `author`

Article authors.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| avatar | media (single, images) | no | — | |
| bio | text | no | — | |
| articles | relation (OTM) | no | — | ← article (mappedBy: author) |

`draftAndPublish: false` — Collection name: `authors`

### 11. `course`

Training/pelatihan entries. Used on Homepage, Persona Page, Pelatihan Page, and Pelatihan Detail Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| excerpt | text | no | — | Short summary for cards |
| description | richtext (CKEditor5) | no | — | Full description |
| image | media (single, images) | yes | — | |
| price | decimal | no | — | Original price |
| final_price | decimal | no | — | Discounted price |
| link | string | yes | — | External enrollment URL |
| instructor | string | no | — | Instructor name |
| course_duration | string | no | — | e.g. "8 Minggu" |
| course_category | relation (MTO) | no | — | → course-category |
| course_tags | relation (M2M) | no | — | → course-tag |
| learning_platform | relation (MTO) | no | — | → learning-platform |
| learning_method | relation (MTO) | no | — | → course-learning-method |
| curriculums | relation (OTM) | no | — | ← curriculum (mappedBy: course) |
| is_featured | boolean | no | — | default: false |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true` — Collection name: `courses`

> **Changed from planning**: Added `instructor`, `course_duration`, `final_price`, `learning_method`, `curriculums`. Removed `target_personas` (JSON) and `countries` (M2M).

### 12. `course-category`

Course categories for filtering on Pelatihan Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| courses | relation (OTM) | no | — | ← course (mappedBy: course_category) |

`draftAndPublish: false` — Collection name: `course_categories`

### 13. `course-tag`

Course tags for filtering on Pelatihan Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| courses | relation (M2M) | no | — | ← course (mappedBy: course_tags) |

`draftAndPublish: false` — Collection name: `course_tags`

### 14. `learning-platform`

Training provider platforms. Displayed on Pelatihan Detail Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| logo | media (single, images) | no | — | |
| url | string | no | — | Platform website |
| courses | relation (OTM) | no | — | ← course (mappedBy: learning_platform) |

`draftAndPublish: false` — Collection name: `learning_platforms`

### 15. `course-learning-method`

Learning method for courses (Offline, Webinar, Self-Paced).

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| courses | relation (OTM) | no | — | ← course (mappedBy: learning_method) |

`draftAndPublish: false` — Collection name: `course_learning_methods`

### 16. `curriculum`

Course curriculum items — individual modules/sections within a course.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | Module title |
| content | richtext (CKEditor5) | no | — | Module description |
| duration | integer | no | — | default: 0 (minutes) |
| order | integer | no | — | default: 0 |
| course | relation (MTO) | no | — | → course |

`draftAndPublish: false` — Collection name: `curriculums`

### 17. `announcement`

Announcement slider for the Homepage Informasi Layanan section. Time-scheduled with start_date and optional end_date.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| excerpt | text | no | — | |
| description | richtext (CKEditor5) | yes | — | Full announcement content |
| image | media (single, images) | yes | — | |
| link | string | yes | — | CTA link |
| start_date | datetime | yes | — | Display start |
| end_date | datetime | no | — | Display end |
| personas | relation (M2M) | no | — | → persona |
| order | integer | no | — | default: 0 |

`draftAndPublish: false` — Collection name: `announcements`

### 18. `faq`

Frequently asked questions for the FAQ page, grouped by category.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | Question |
| content | richtext (CKEditor5) | yes | — | Answer |
| faq_category | relation (MTO) | no | — | → faq-category |
| order | integer | no | — | default: 0 |

`draftAndPublish: false` — Collection name: `faqs`

### 19. `faq-category`

FAQ grouping categories for organizing FAQs into sections.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| order | integer | no | — | default: 0 |
| faqs | relation (OTM) | no | — | ← faq (mappedBy: faq_category) |

`draftAndPublish: false` — Collection name: `faq_categories`

> **Pattern**: Same as `article-category`/`course-category`. Groups FAQs into collapsible sections (e.g. "Tentang Jari PMI", "Pendaftaran", "Pelatihan").

### 19. `tool`

Helpful tools/resources displayed on Persona Page Alat Bantu section.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | Tool/resource name |
| description | richtext (CKEditor5) | no | — | |
| link | string | no | — | |
| logo | media (single, images) | no | — | |
| personas | relation (M2M) | no | — | → persona |

`draftAndPublish: false` — Collection name: `tools`

### 20. `province`

Province reference data for filtering Purna PMI entries.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| image | media (single, images) | no | — | |
| is_featured | boolean | no | — | default: false |
| order | integer | no | — | default: 0 |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: false` — Collection name: `provinces`

### 21. `purna-pmi`

Purna PMI success stories and business profiles.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | Business/person name |
| slug | uid (targetField: name) | yes | — | |
| brand | string | no | — | Brand name |
| business_type | string | no | — | |
| products | string | no | — | |
| revenue | string | no | — | |
| employee_count | string | no | — | |
| production_capacity | string | no | — | |
| year_established | integer | no | — | |
| legal_entity | string | no | — | |
| city | string | no | — | |
| contact | string | no | — | |
| marketing_channels | enumeration | no | — | Retail, Online, Ekspor |
| province | relation (MTO) | no | — | → province |
| image | media (single, images) | no | — | |
| is_featured | boolean | no | — | default: false |
| order | integer | no | — | default: 0 |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true` — Collection name: `purna_pmis`

---

## Components Referenced

These components are defined separately and referenced by entities above.

| Category | Component | Used By |
|----------|-----------|---------|
| shared | `shared.seo` | All entities with meta_seo |
| shared | `shared.link` | global (nav_links, external_links), footer-column (links), feature-card (link) |
| section | `section.hero` | homepage |
| section | `section.persona-card` | homepage (persona_cards) |
| section | `section.step-item` | tab-panel (nested), future use |
| section | `section.feature-card` | Future use |
| section | `section.accordion-item` | tab-panel (nested), future use |
| section | `section.tab-panel` | Future use |
| layout | `layout.footer-column` | global (footer_columns) |
| layout | `layout.social-link` | global (social_links) |

### Component Field Definitions

**`shared.seo`**: `meta_title` (string, required), `meta_description` (text, required), `meta_keywords` (string), `share_image` (media), `canonical_url` (string)

**`shared.link`**: `label` (string, required), `url` (string, required), `is_external` (boolean, default: false)

**`layout.footer-column`**: `heading` (string, required), `links` (component: shared.link, repeatable)

**`layout.social-link`**: `platform` (enum: facebook/twitter/instagram/youtube/tiktok/linkedin, required), `url` (string, required)

**`section.hero`**: `headline` (string, required), `highlighted_text` (string), `description` (text), `search_placeholder` (string), `illustration` (media)

**`section.persona-card`**: `title` (string, required), `description` (text, required), `icon` (media), `slug` (string, required)

**`section.step-item`**: `step_number` (integer, required), `title` (string, required), `description` (text), `icon` (media)

**`section.accordion-item`**: `title` (string, required), `content` (richtext, required)

**`section.tab-panel`**: `tab_label` (string, required), `tab_slug` (string, required), `content` (richtext), `accordions` (component: section.accordion-item, repeatable), `steps` (component: section.step-item, repeatable)

**`section.feature-card`**: `title` (string, required), `description` (text), `icon` (media), `image` (media), `link` (component: shared.link, non-repeatable)

---

## Custom APIs (No Schema)

| API | Endpoint | Auth | Description |
|-----|----------|------|-------------|
| Search | `GET /api/search` | public | Algolia search proxy with facets |
| Popular Searches | `GET /api/search/popular` | public | Top 5 searches from Redis |

---

## Notes

- **No `training-page` or `article-list-page` singleTypes needed.** These listing pages are frontend-driven. Pelatihan Page renders `course` collection with filters. List Artikel Page renders `article` collection with filters.
- **`persona` is a collection** because there are 4 distinct entries. It stores identity data (name, description, image, background_color) + hero data (banner_title, banner_subtitle). Section content is assembled by the frontend from generic collections.
- **`content-group` + `content`** group mixed informational content (tips, guides, highlights) for Persona Pages and `/konten/:groupSlug`. This is separate from `article`, which is strictly for news/blog-style content.
- **`course` detail page** reads directly from the `course` collection by slug with nested `curriculums`. No separate entity needed.
- **`tab-panel`**, **`accordion-item`**, **`step-item`**, and **`feature-card`** components are fully defined but not yet referenced by any content type — ready for future page sections.
- **Rich text fields** use CKEditor5 (plugin `@_sh/strapi-plugin-ckeditor`) with custom HTML preset. Fields marked `richtext (CKEditor5)` are `customField: plugin::ckeditor5.CKEditor`.
