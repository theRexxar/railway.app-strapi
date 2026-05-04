# JARI PMI — Strapi CMS

Strapi v5 CMS for JARI PMI — a landing page providing information for Indonesian migrant workers (PMI).

## Getting Started

### `develop`

Start with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```bash
npm run develop
```

### `start`

Start with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```bash
npm run start
```

### `build`

Build the admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```bash
npm run build
```

### `generate:docs`

Generate the OpenAPI/Swagger spec. Reads the `URL` env var for the server URL.

```bash
npm run generate:docs
```

## Data Seeding

Seed the database with sample data (article categories, articles, courses, countries, etc.):

```bash
SEED=true npm run develop
```

This runs the seeder on bootstrap and then starts Strapi normally. The seed script is in `scripts/seed.ts` and creates:

- Article categories & tags
- Course categories & tags
- Learning platforms
- Authors
- Countries, protection info, service info
- Articles & courses
- Alerts
- Content groups & contents
- Global settings

## Algolia Reindex

Reindex all content to Algolia search:

```bash
# Option 1: Via env variable (runs on bootstrap then exits)
REINDEX=true npm run develop

# Option 2: Standalone script (starts Strapi, reindexes, then exits)
npx tsx scripts/reindex.ts
```

Requires `ALGOLIA_APPLICATION_ID`, `ALGOLIA_ADMIN_API_KEY`, `ALGOLIA_SEARCH_API_KEY`, and `ALGOLIA_INDEX_NAME` env vars to be set.

## CKEditor

The project uses [CKEditor 5](https://ckeditor.com/ckeditor-5/) as the rich text editor for `content` (Article) and `body` (Content) fields, configured with a full toolbar including source editing (HTML mode).

Configuration is in `src/admin/app.tsx`. Available presets: `defaultHtml`.

## Deployment

### Railway CLI

1. **Install & login**

```bash
npm install -g @railway/cli
railway login
```

2. **Initialize & link project**

```bash
railway init
# or link to existing project
railway link
```

3. **Set environment variables**

```bash
railway variables set NODE_ENV=production
railway variables set HOST=0.0.0.0
railway variables set PORT=1337
railway variables set APP_KEYS="key1,key2"
railway variables set ADMIN_JWT_SECRET=your-secret
railway variables set API_TOKEN_SALT=your-salt
railway variables set TRANSFER_TOKEN_SALT=your-salt
railway variables set JWT_SECRET=your-secret
railway variables set DATABASE_URL=postgresql://user:pass@host:5432/jari_pmi
railway variables set DATABASE_SSL=true
railway variables set URL=https://your-app.railway.app
railway variables set ADMIN_URL=https://your-app.railway.app/admin
railway variables set REDIS_URL=redis://default:pass@host:6379
railway variables set ALGOLIA_APPLICATION_ID=your-app-id
railway variables set ALGOLIA_ADMIN_API_KEY=your-admin-key
railway variables set ALGOLIA_SEARCH_API_KEY=your-search-key
railway variables set ALGOLIA_INDEX_NAME=jari_pmi_staging
railway variables set CLOUDINARY_NAME=your-cloudinary-name
railway variables set CLOUDINARY_KEY=your-cloudinary-key
railway variables set CLOUDINARY_SECRET=your-cloudinary-secret
```

4. **Deploy**

```bash
railway up
```

5. **View logs & dashboard**

```bash
railway logs
railway open
```

For more details, see the [Railway CLI documentation](https://docs.railway.app/).

## Environment Variables

See `.env.example` for all available variables. Key variables:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment: `development`, `staging`, `production` |
| `URL` | Public URL of the app (used for API docs server URL) |
| `ADMIN_URL` | Admin panel URL |
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_SSL` | Enable SSL for database (`true`/`false`) |
| `DATABASE_NAME` | Override database name from `DATABASE_URL` |
| `REDIS_URL` | Redis connection string (falls back to `REDIS_HOST`/`PORT`/`PASSWORD`) |
| `ALGOLIA_*` | Algolia search configuration |
| `CLOUDINARY_*` | Cloudinary media upload configuration |

## Project Structure

- `src/api/` — Content types (article, course, country, search, etc.)
- `src/algolia/` — Algolia search integration (indexer, config, hooks)
- `src/cache/` — Redis cache middleware and invalidation
- `scripts/` — Seed, reindex, and OpenAPI generation scripts
- `config/env/production/` — Production-specific config (URL, proxy, admin URL)
- `config/env/staging/` — Staging-specific config
- `public/docs/openapi.yaml` — Auto-generated API docs

## API Documentation

Swagger UI is served at `/api/docs` when the documentation plugin is enabled. The OpenAPI spec is generated from content type schemas and includes:

- All CRUD endpoints for each content type
- `/search` endpoint (Algolia-powered full-text search)
- Pagination, filtering, and population parameters
- Bearer token authentication

Regenerate after schema changes:

```bash
npm run generate:docs
```

## Health Check

The app provides a health check endpoint at `GET /health` that checks memory, disk, and database connectivity. Used by Railway for deployment health checks.

## Learn More

- [Strapi documentation](https://docs.strapi.io)
- [Strapi tutorials](https://strapi.io/tutorials)
- [Strapi blog](https://strapi.io/blog)
- [Changelog](https://strapi.io/changelog)