# Pages

11 page types. Personae are enum values within the Persona Page, not separate page types.

## Home

| Section | API | Endpoint |
|---------|-----|----------|
| Modal Persona Selector | `GET /api/personas` | `?populate=*&sort=order:asc` |
| Popular Searches | `GET /api/search/popular` | — |
| Section Search | `GET /api/search` | `?q={query}` |
| Section Informasi Layanan | `GET /api/service-infos` | `?filters[link][$notNull]=true&populate=*&status=published` |
| Section Negara Tujuan | `GET /api/countries` | `?populate=*&sort=order:asc` |
| Section Pelatihan Untuk Kamu | `GET /api/courses` | `?populate=*&status=published` |
| Section Artikel Terbaru | `GET /api/articles` | `?populate=*&status=published&sort=createdAt:desc&pagination[pageSize]=10` |

## Informasi PMI (Persona Page)

| Section | API | Endpoint |
|---------|-----|----------|
| Hero | `GET /api/personas` | `?filters[slug][$eq]={slug}&populate=*` |
| Section Pilihan informasi | `GET /api/content-groups` | `?filters[personas][slug][$eq]={personaSlug}&populate[contents][populate]=image&populate[contents][filters][status][$eq]=published&populate[service_infos][populate]=cover_image&populate[protection_infos][populate]=icon&populate[courses][populate]=image&populate[countries][populate]=*&sort=order:asc&status=published` |
| Section Penting Diketahui | `GET /api/protection-infos` | `?populate=*&sort=order:asc` |
| Section Alat Bantu Interaktif | `GET /api/tools` | `?filters[personas][slug][$eq]={personaSlug}&populate=*` |
| Section Negara Tujuan | `GET /api/countries` | `?populate=*&sort=order:asc` |
| Section Pelatihan Untuk Kamu | `GET /api/courses` | `?populate=*&status=published` |

## Page Detail Informasi dari Pilihan Informasi

| Section | API | Endpoint |
|---------|-----|----------|
| Section Hero | `GET /api/content-groups` | `?filters[slug][$eq]={slug}&populate=*&status=published` |
| Section Content | `GET /api/contents` | `?filters[content_group][documentId][$eq]={id}&populate=*&status=published&sort=order:asc` |

## Page Negara Tujuan

| Section | API | Endpoint |
|---------|-----|----------|
| Section Negara Tujuan Migran | `GET /api/countries` | `?populate=*&sort=order:asc` |

## Page Detail Negara Tujuan

| Section | API | Endpoint |
|---------|-----|----------|
| Section Penjelasan | `GET /api/countries` | `?filters[slug][$eq]={slug}&populate=*` |
| Section Pilihan informasi | `GET /api/content-groups` | `?filters[countries][slug][$eq]={countrySlug}&populate[contents][populate]=image&populate[contents][filters][status][$eq]=published&sort=order:asc&status=published` |

## Page Detail Informasi dari Pilihan Informasi Country

Sama seperti [Page Detail Informasi dari Pilihan Informasi](#page-detail-informasi-dari-pilihan-informasi).

## Page Informasi Keuangan

| Section | API | Endpoint |
|---------|-----|----------|
| Section Penjelasan | `GET /api/service-infos` | `?filters[slug][$eq]={slug}&populate=*&status=published` |
| Section Pilihan informasi | `GET /api/content-groups` | `?filters[service_infos][slug][$eq]={serviceInfoSlug}&populate[contents][populate]=image&populate[contents][filters][status][$eq]=published&sort=order:asc&status=published` |

## Page Detail Informasi dari Pilihan Informasi Keuangan

Sama seperti [Page Detail Informasi dari Pilihan Informasi](#page-detail-informasi-dari-pilihan-informasi).

## Page Pelatihan

| Section | API | Endpoint |
|---------|-----|----------|
| Section List Pelatihan | `GET /api/courses` | `?populate=*&status=published&pagination[page]=1&pagination[pageSize]=25&sort=name:asc` |
| ↳ Filter by harga | | `&filters[price][$gte]={min}&filters[price][$lte]={max}` |
| ↳ Filter by kategori | | `&filters[course_category][slug][$eq]={categorySlug}` |
| ↳ Filter by Lembaga Pelatihan | | `&filters[learning_platform][slug][$eq]={platformSlug}` |
| ↳ Search (algolia) | `GET /api/search` | `?q={query}&type=course` |
| Section List category | `GET /api/course-categories` | `?populate=*` |
| Section List Lembaga Pelatihan | `GET /api/learning-platforms` | `?populate=*` |

## Page Pelatihan Detail

| Section | API | Endpoint |
|---------|-----|----------|
| Section pelatihan | `GET /api/courses/{documentId}` | `?populate=*` |

## Page Artikel

| Section | API | Endpoint |
|---------|-----|----------|
| Section List artikel | `GET /api/articles` | `?populate=*&status=published&pagination[page]=1&pagination[pageSize]=25&sort=createdAt:desc` |
| ↳ Filter by kategori | | `&filters[article_category][slug][$eq]={categorySlug}` |
| ↳ Search (algolia) | `GET /api/search` | `?q={query}&type=article` |
| Section list kategori | `GET /api/article-categories` | `?populate=*` |
