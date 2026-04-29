# Strapi Entities

Pages are handled by the frontend. Strapi stores only the dynamic data those pages consume.

## Standalone (singleType)

### 1. `global`

Site-wide config: navbar, footer, social links, default SEO. **Read-only via API** (`GET /api/global` only). Edits via admin panel.

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

Homepage editorial: hero content, persona modal, curated featured items per section. **Read-only via API** (`GET /api/homepage` only). Edits via admin panel.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| hero | component (section.hero) | yes | — | Non-repeatable |
| persona_modal_title | string | no | — | e.g. "Informasi PMI" |
| persona_modal_text | text | no | — | e.g. "Halo sobat migran, pilih profil kamu..." |
| persona_cards | component (section.persona-card) | no | yes | 4 persona entries |
| service_section_title | string | no | — | e.g. "Informasi Layanan PMI Terbaru" |
| service_section_desc | text | no | — | |
| featured_services | relation | no | — | oneToMany → service-info |
| country_section_title | string | no | — | e.g. "Negara Tujuan" |
| featured_countries | relation | no | — | oneToMany → country |
| training_section_title | string | no | — | e.g. "Pelatihan Bersertifikat" |
| featured_courses | relation | no | — | oneToMany → course |
| article_section_title | string | no | — | e.g. "Artikel Dan Berita Terbaru" |
| featured_articles | relation | no | — | oneToMany → article |
| meta_seo | component (shared.seo) | no | — | |

---

## Collection (collectionType)

Each creates full CRUD API endpoints (`GET /api/<name>`, `GET /api/<name>/:id`, `GET /api/<name>?filters[...]&pagination[...]`).

### 1. `persona`

One entry per persona. Lightweight — only stores persona identity. Section content (Penting Diketahui, Alat Bantu, Negara Tujuan, Pelatihan) is assembled by the frontend from generic collections.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | e.g. "Calon PMI" |
| slug | uid (targetField: name) | yes | — | |
| description | text | yes | — | e.g. "Berencana bekerja di luar negeri" |
| image | media (single, images) | yes | — | Persona illustration/icon |
| background_color | string | no | — | Hex color for persona theme, e.g. "#1A5276" |
| order | integer | no | — | default: 0, for manual sorting |
| meta_seo | component (shared.seo) | no | — | |

### 2. `alert`

Site-wide alert banners. Shown on pages matching the `pages` field value.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| type | enumeration | yes | — | info, warning, success, error |
| icon | media (single, images) | no | — | Alert icon |
| message | text | yes | — | Alert message text |
| link | string | no | — | Optional external or internal URL |
| pages | string | yes | — | Comma-separated page names where alert appears, e.g. "homepage,calon-pmi,pelatihan" |
| active | boolean | no | — | default: true, to toggle visibility |

`draftAndPublish: true`

### 3. `country`

Destination countries for migrant workers. Shared across Homepage, Persona Page, Pelatihan.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| flag | media (single, images) | yes | — | Country flag |
| image | media (single, images) | no | — | Card/hero image |
| description | richtext | no | — | |
| region | enumeration | no | — | asia, middle-east, europe, africa, americas, oceania |
| is_featured | boolean | no | — | default: false |
| order | integer | no | — | default: 0, for manual sorting |
| meta_seo | component (shared.seo) | no | — | |
| vacancy_count | integer | no | — | |
| salary_avg | text | no | — | |
| pmi_count | integer | no | — | |

### 4. `service-info`

Service/layanan entries (e.g. QRIS Cross Border). Displayed on Homepage Informasi Layanan section.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | |
| slug | uid (targetField: title) | yes | — | |
| excerpt | text | no | — | Short summary for cards |
| content | richtext | yes | — | Full content |
| cover_image | media (single, images) | yes | — | |
| countries | relation | no | — | manyToMany → country (for flags) |
| category | string | no | — | e.g. "Budaya", "Ketenagakerjaan" |
| is_featured | boolean | no | — | default: false |

`draftAndPublish: true`

### 5. `protection-info`

Protection info entries for Penting Diketahui section on Persona Pages.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | |
| slug | uid (targetField: title) | yes | — | |
| description | text | no | — | |
| content | richtext | yes | — | |
| icon | media (single, images) | no | — | |
| category | enumeration | no | — | perlindungan, hak-pmi, jaminan-sosial, klaim, reasuransi |
| order | integer | no | — | default: 0 |

### 6. `content-group`

Groups content under a themed section. Each group contains items of **one type** (determined by `content_type`). Used on Persona Page Content Group and Content Group Page (`/konten/:groupSlug`).

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | unique |
| slug | uid (targetField: title) | yes | — | |
| description | text | no | — | Group intro text |
| image | media (single, images) | no | — | Group cover image |
| content_type | enumeration | yes | — | content, country, service-info, protection-info, course |
| contents | relation | no | — | manyToMany → content (when content_type=content) |
| countries | relation | no | — | manyToMany → country (when content_type=country) |
| service_infos | relation | no | — | manyToMany → service-info (when content_type=service-info) |
| protection_infos | relation | no | — | manyToMany → protection-info (when content_type=protection-info) |
| courses | relation | no | — | manyToMany → course (when content_type=course) |
| personas | relation | no | — | manyToMany → persona (which personas show this group) |
| order | integer | no | — | default: 0 |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true`

> **Pattern:** `content_type` determines which relation field the frontend should populate and render. Only one relation field is active per group. For example, `content_type=country` means the `countries` relation holds the items; all others are empty.

### 7. `content`

Individual content entries within a content group. Generic informational content (tips, guides, highlights) — distinct from news articles.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | |
| slug | uid (targetField: title) | yes | — | |
| excerpt | text | no | — | Short summary for cards |
| body | richtext | yes | — | Full content |
| image | media (single, images) | no | — | Cover/icon image |
| link | string | no | — | Optional external URL |
| content_group | relation | no | — | manyToOne → content-group |
| order | integer | no | — | default: 0, for sorting within group |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true`

### 8. `article`

News and informational articles. Used on Homepage, List Artikel, Artikel Page, and Content Group Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| title | string | yes | — | unique |
| slug | uid (targetField: title) | yes | — | |
| excerpt | text | yes | — | Short summary for cards |
| content | richtext | yes | — | Full article body |
| cover_image | media (single, images) | yes | — | |
| article_category | relation | no | — | manyToOne → article-category |
| article_tags | relation | no | — | manyToMany → article-tag |
| author | relation | no | — | manyToOne → author |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true`

### 9. `article-category`

Article categories for organizing and filtering articles.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| description | text | no | — | |
| image | media (single, images) | no | — | Category image |

### 10. `article-tag`

Article tags for filtering on List Artikel and Artikel Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |

### 11. `author`

Article authors.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| avatar | media (single, images) | no | — | |
| bio | text | no | — | |

### 12. `course`

Training/pelatihan entries. Used on Homepage, Persona Page, Pelatihan Page, and Pelatihan Detail Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| excerpt | text | no | — | Short summary for cards |
| description | richtext | no | — | Full description |
| image | media (single, images) | yes | — | |
| price | decimal | no | — | |
| link | string | yes | — | External enrollment URL |
| course_category | relation | no | — | manyToOne → course-category |
| course_tags | relation | no | — | manyToMany → course-tag |
| learning_platform | relation | no | — | manyToOne → learning-platform |
| countries | relation | no | — | manyToMany → country |
| target_personas | json | no | — | e.g. ["calon-pmi", "pmi-aktif"] |
| is_featured | boolean | no | — | default: false |
| meta_seo | component (shared.seo) | no | — | |

`draftAndPublish: true`

### 13. `course-category`

Course categories for filtering on Pelatihan Page and Pelatihan Detail Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |

### 14. `course-tag`

Course tags for filtering on Pelatihan Page and Pelatihan Detail Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |

### 15. `learning-platform`

Training provider platforms. Displayed on Pelatihan Detail Page.

| Field | Type | Required | Repeatable | Notes |
|-------|------|----------|------------|-------|
| name | string | yes | — | unique |
| slug | uid (targetField: name) | yes | — | |
| logo | media (single, images) | no | — | |
| url | string | no | — | Platform website |

---

## Components Referenced

These components are defined separately and referenced by entities above.

| Category | Component | Used By |
|----------|-----------|---------|
| shared | `shared.seo` | All entities with meta_seo |
| shared | `shared.link` | global (nav_links, external_links, footer_columns) |
| section | `section.hero` | homepage |
| section | `section.persona-card` | homepage (persona_cards) |
| section | `section.step-item` | — (available for future use) |
| section | `section.feature-card` | — (available for future use) |
| section | `section.accordion-item` | — (available for future use) |
| section | `section.tab-panel` | — (available for future use) |
| layout | `layout.footer-column` | global (footer_columns) |
| layout | `layout.social-link` | global (social_links) |

## Notes

- **No `training-page` or `article-list-page` singleTypes needed.** These listing pages are frontend-driven. Pelatihan Page renders `course` collection with filters. List Artikel Page renders `article` collection with filters.
- **No `protection-page` singleType needed.** Protection info is served as entries from `protection-info` collection, rendered under Persona Page Penting Diketahui section by the frontend.
- **`persona-page` is a collection** because there are 4 distinct entries. It stores only identity data (name, description, image, background_color). Section content is assembled by the frontend from generic collections.
- **`content-group` + `content`** group mixed informational content (tips, guides, highlights) for Persona Pages and `/konten/:groupSlug`. This is separate from `article`, which is strictly for news/blog-style content.
- **`course` detail page** reads directly from the `course` collection by slug. No separate entity needed.