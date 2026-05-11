# Pages — API Mappings

14 page types. Personae are entries within the `persona` collection, not separate page types.

## Home

| Section | API | Endpoint |
|---------|-----|----------|
| Modal Persona Selector | `GET /api/personas` | `?populate=*&sort=order:asc` |
| Search | `GET /api/search` | `?q={query}` |
| Alert | `GET /api/alerts` | `?filters[active][$eq]=true&filters[personas][slug][$eq]=homepage&populate=*` |
| Section Informasi Layanan | `GET /api/announcements` | `?filters[start_date][$lte]=now&filters[$or][0][end_date][$gte]=now&filters[$or][1][end_date][$null]=true&populate=*&sort=order:asc` |
| Section Negara Tujuan | `GET /api/homepage` | `?populate[featured_countries][populate]=*` |
| Section Pelatihan | `GET /api/homepage` | `?populate[featured_courses][populate]=*` |
| Section Artikel Terbaru | `GET /api/homepage` | `?populate[featured_articles][populate]=*` |

## Informasi PMI (Persona Page)

| Section | API | Endpoint |
|---------|-----|----------|
| Hero | `GET /api/personas` | `?filters[slug][$eq]={slug}&populate=*` |
| Alert | `GET /api/alerts` | `?filters[active][$eq]=true&filters[personas][slug][$eq]={personaSlug}&populate=*` |
| Section Pilihan Informasi | `GET /api/content-groups` | `?filters[personas][slug][$eq]={personaSlug}&populate[service_infos][populate]=image&populate[countries][populate]=*&sort=order:asc&status=published` |
| Section Penting Diketahui | `GET /api/contents` | `?filters[content_group][documentId][$in][0]={id1}&filters[content_group][documentId][$in][1]={id2}&filters[is_featured][$eq]=true&populate[content_group][fields][0]=slug&populate[content_group][fields][1]=documentId&populate=*&status=published&sort=order:asc` — content-group IDs from Section Pilihan Informasi above |
| Section Alat Bantu | `GET /api/tools` | `?filters[personas][slug][$eq]={personaSlug}&populate=*` |
| Section Negara Tujuan | `GET /api/countries` | `?populate=*&sort=order:asc` |
| Section Pelatihan | `GET /api/courses` | `?populate=*&status=published` |

## Content Group Detail (`/konten/:groupSlug`)

| Section | API | Endpoint |
|---------|-----|----------|
| Group Header | `GET /api/content-groups` | `?filters[slug][$eq]={slug}&populate=*&status=published` |
| Content Items | `GET /api/contents` | `?filters[content_group][documentId][$eq]={id}&populate=*&status=published&sort=order:asc` |

## Negara Tujuan

| Section | API | Endpoint |
|---------|-----|----------|
| List Negara | `GET /api/countries` | `?populate=*&sort=order:asc` |

## Negara Tujuan Detail (`/negara-tujuan/:slug`)

| Section | API | Endpoint |
|---------|-----|----------|
| Detail Negara | `GET /api/countries` | `?filters[slug][$eq]={slug}&populate=*` |
| Pilihan Informasi | `GET /api/content-groups` | `?filters[countries][slug][$eq]={countrySlug}&sort=order:asc&status=published` |

## Informasi Keuangan (`/keuangan/:slug`)

| Section | API | Endpoint |
|---------|-----|----------|
| Detail Layanan | `GET /api/service-infos` | `?filters[slug][$eq]={slug}&populate=*&status=published` |
| Pilihan Informasi | `GET /api/content-groups` | `?filters[service_infos][slug][$eq]={serviceInfoSlug}&sort=order:asc&status=published` |

## Pelatihan

| Section | API | Endpoint |
|---------|-----|----------|
| List Pelatihan | `GET /api/courses` | `?populate[course_category][fields][0]=name&populate[course_category][fields][1]=slug&populate[learning_platform][fields][0]=name&populate[learning_platform][fields][1]=slug&populate[learning_method][fields][0]=name&populate[learning_method][fields][1]=slug&populate[curriculums][count]=true&populate=image&status=published&pagination[page]=1&pagination[pageSize]=25&sort=name:asc` |
| ↳ Filter by price | | `&filters[final_price][$gte]={min}&filters[final_price][$lte]={max}` |
| ↳ Filter by category | | `&filters[course_category][slug][$eq]={categorySlug}` |
| ↳ Filter by tag | | `&filters[course_tags][slug][$eq]={tagSlug}` |
| ↳ Filter by platform | | `&filters[learning_platform][slug][$eq]={platformSlug}` |
| ↳ Filter by learning method | | `&filters[learning_method][slug][$eq]={methodSlug}` |
| ↳ Search (Algolia) | `GET /api/search` | `?q={query}&type=course` |
| List Categories | `GET /api/course-categories` | `?populate=*` |
| List Tags | `GET /api/course-tags` | `?populate=*` |
| List Platforms | `GET /api/learning-platforms` | `?populate=*` |
| List Learning Methods | `GET /api/course-learning-methods` | `?populate=*` |

## Pelatihan Detail (`/pelatihan/:slug`)

| Section | API | Endpoint |
|---------|-----|----------|
| Detail Pelatihan | `GET /api/courses` | `?filters[slug][$eq]={slug}&populate[course_category][populate]=*&populate[course_tags][populate]=*&populate[learning_platform][populate]=*&populate[learning_method][populate]=*&populate[curriculums][sort]=order:asc&populate[curriculums][populate]=*&populate=image` |

## Artikel

| Section | API | Endpoint |
|---------|-----|----------|
| List Artikel | `GET /api/articles` | `?populate[article_category][fields][0]=name&populate[article_category][fields][1]=slug&populate[author][fields][0]=name&populate[author][fields][1]=slug&populate=cover_image&populate=excerpt&status=published&pagination[page]=1&pagination[pageSize]=25&sort=publishedAt:desc` |
| ↳ Filter by category | | `&filters[article_category][slug][$eq]={categorySlug}` |
| ↳ Filter by tag | | `&filters[article_tags][slug][$eq]={tagSlug}` |
| ↳ Search (Algolia) | `GET /api/search` | `?q={query}&type=article` |
| List Categories | `GET /api/article-categories` | `?populate=*` |
| List Tags | `GET /api/article-tags` | `?populate=*` |

## Artikel Detail (`/artikel/:slug`)

| Section | API | Endpoint |
|---------|-----|----------|
| Artikel | `GET /api/articles` | `?filters[slug][$eq]={slug}&populate[article_category][populate]=*&populate[article_tags][populate]=*&populate[author][populate]=*&populate=cover_image&populate=content` |
| Related Articles | `GET /api/articles` | `?filters[article_category][slug][$eq]={categorySlug}&filters[slug][$ne]={currentSlug}&populate[article_category][fields][0]=name&populate[author][fields][0]=name&populate=cover_image&status=published&pagination[pageSize]=3&sort=publishedAt:desc` |

## Purna PMI

| Section | API | Endpoint |
|---------|-----|----------|
| List Purna PMI | `GET /api/purna-pmis` | `?populate[province][fields][0]=name&populate[province][fields][1]=slug&populate=image&populate=is_featured&populate=brand&populate=products&populate=city&sort=order:asc&status=published` |
| ↳ Filter by province | | `&filters[province][slug][$eq]={provinceSlug}` |
| List Provinces | `GET /api/provinces` | `?sort=order:asc&fields=name,slug` |

## FAQ

| Section | API | Endpoint |
|---------|-----|----------|
| List FAQ | `GET /api/faqs` | `?sort=order:asc&populate=*` |

## Global (Shared Across Pages)

| Purpose | API | Endpoint |
|---------|-----|----------|
| Site Config | `GET /api/global` | `?populate=*` (custom controller, auth: false) |
| Popular Searches | `GET /api/search/popular` | — |
| Search | `GET /api/search` | `?q={query}` |
