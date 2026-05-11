# JARI PMI — Container Diagram (C4 Level 2)

```mermaid
graph TB
    %% ── Actors ──
    user("🧑‍💻 Pengguna<br/><small>Calon PMI · PMI Aktif<br/>Keluarga PMI · Purna PMI</small>")
    admin("🛠️ Content Admin<br/><small>JARI PMI content editors</small>")

    %% ── JARI PMI Platform ──
    subgraph jari["══ JARI PMI Platform ══"]
        direction TB

        subgraph frontends["Frontend Layer"]
            web("🌐 Web Frontend<br/><small>Express.js + Template Engine<br/>Server-side rendered HTML</small>")
            mobile("📱 Mobile App<br/><small>Native Android</small>")
        end

        strapi("⚙️ Strapi CMS v5<br/><small>Headless CMS · TypeScript<br/>Content modeling & REST APIs<br/>Lifecycle hooks</small>")

        subgraph data["Data Layer"]
            pg[("🗄️ PostgreSQL<br/><small>15 collections<br/>2 single types</small>")]
            redis[("⚡ Redis<br/><small>API response cache<br/>22 endpoints</small>")]
        end
    end

    %% ── External Services ──
    cloudinary("☁️ Cloudinary<br/><small>Media CDN<br/>Images · Logos · Flags</small>")
    algolia("🔍 Algolia<br/><small>Search index<br/>6 content types</small>")

    %% ── User → Frontend ──
    user -->|"Browse & search"| web
    user -->|"Browse & search"| mobile
    admin --->|"CRUD content"| strapi

    %% ── Frontend → Backend ──
    web -->|"REST API /api/*"| strapi
    mobile -->|"REST API /api/*"| strapi
    web -.->|"Page cache"| redis

    %% ── Backend → Data ──
    strapi -->|"Read/Write"| pg
    strapi -->|"Read/Write/Invalidate"| redis

    %% ── Backend → External ──
    strapi -->|"Upload & serve media"| cloudinary
    strapi -->|"Sync index<br/><small>Admin API Key</small>"| algolia

    %% ── Styles ──
    classDef actor fill:#1A1A2E,stroke:#16213E,color:#E8E8E8,stroke-width:2px
    classDef frontend fill:#0F3460,stroke:#1A5276,color:#E8E8E8,stroke-width:2px
    classDef cms fill:#533483,stroke:#7B2D8B,color:#E8E8E8,stroke-width:2px
    classDef database fill:#1B4F72,stroke:#2E86C1,color:#E8E8E8,stroke-width:2px
    classDef external fill:#145A32,stroke:#1E8449,color:#E8E8E8,stroke-width:2px
    classDef boundary fill:#F8F9FA,stroke:#ADB5BD,color:#2C3E50,stroke-width:1px
    classDef subgroup fill:#FCFCFC,stroke:#DEE2E6,color:#2C3E50,stroke-width:1px,stroke-dasharray: 5 5

    class user,admin actor
    class web,mobile frontend
    class strapi cms
    class pg,redis database
    class cloudinary,algolia external
    class jari boundary
    class frontends,data subgroup
```

## Containers

| Container | Technology | Role |
|-----------|-----------|------|
| **Web Frontend** | Express.js + Template Engine | Server-side rendered HTML pages; 13 page types |
| **Mobile App** | Native Android | Native mobile experience; same 13 page types |
| **Strapi CMS v5** | Node.js + TypeScript | Headless CMS — REST APIs, content modeling, lifecycle hooks |
| **PostgreSQL** | Relational Database | Content persistence — 15 collections, 2 single types, components |
| **Redis** | In-memory Cache | API response cache (22 endpoints) + SSR page cache |

## Relationships

| # | From | To | Protocol | Description |
|---|------|----|----------|-------------|
| 1 | Pengguna | Web Frontend | HTTPS | Browse 13 page types via browser |
| 2 | Pengguna | Mobile App | HTTPS | Same pages via native Android app |
| 3 | Content Admin | Strapi CMS | HTTPS | Create, edit, publish content via Admin Panel |
| 4 | Web Frontend | Strapi CMS | HTTPS | All dynamic content via REST API |
| 5 | Mobile App | Strapi CMS | HTTPS | Same REST API consumption |
| 6 | Web Frontend | Redis | TCP | SSR page-level caching |
| 7 | Strapi CMS | PostgreSQL | TCP | Content persistence |
| 8 | Strapi CMS | Redis | TCP | API response caching; invalidated via lifecycle hooks |
| 9 | Strapi CMS | Cloudinary | HTTPS | Media upload & CDN delivery |
| 10 | Strapi CMS | Algolia | HTTPS | Lifecycle hooks sync 6 searchable content types |

## Design Rules

- **No direct external access** — Frontends never call Algolia; all search proxied through `/api/search`
- **Cache layers** — Strapi caches API responses in Redis; Web Frontend caches SSR pages in Redis
- **Media isolation** — All assets served via Cloudinary CDN, never stored in PostgreSQL
- **Search isolation** — Algolia write-only via lifecycle hooks, read-only via search proxy
