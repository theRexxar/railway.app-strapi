# JARI PMI — System Context Diagram (C4 Level 1)

```mermaid
graph TB
    %% ── Actors ──
    user("🧑‍💻 Pengguna<br/><small>Calon PMI · PMI Aktif<br/>Keluarga PMI · Purna PMI</small>")
    admin("🛠️ Content Admin<br/><small>JARI PMI content editors</small>")

    %% ── System ──
    jari("🏗️ JARI PMI Platform<br/><small>CMS-driven information portal<br/>for Indonesian migrant workers</small>")

    %% ── External Systems ──
    cloudinary("☁️ Cloudinary<br/><small>Media CDN</small>")
    algolia("🔍 Algolia<br/><small>Search index</small>")

    %% ── Relationships ──
    user -->|"Browse & search<br/><small>HTTPS</small>"| jari
    admin -->|"Manage content<br/><small>HTTPS</small>"| jari
    jari -->|"Upload & serve media<br/><small>HTTPS</small>"| cloudinary
    jari -->|"Sync search index<br/><small>HTTPS</small>"| algolia

    %% ── Styles ──
    classDef actor fill:#1A1A2E,stroke:#16213E,color:#E8E8E8,stroke-width:2px
    classDef system fill:#0F3460,stroke:#1A5276,color:#E8E8E8,stroke-width:3px
    classDef external fill:#145A32,stroke:#1E8449,color:#E8E8E8,stroke-width:2px

    class user,admin actor
    class jari system
    class cloudinary,algolia external
```

## Overview

The **JARI PMI Platform** is a CMS-driven information portal serving Indonesian migrant workers. At the highest level, the system interacts with 2 user types and depends on 2 external services.

| Actor | Role |
|-------|------|
| **Pengguna** | Indonesian migrant workers (Calon PMI, PMI Aktif, Keluarga PMI, Purna PMI) browsing web or mobile |
| **Content Admin** | JARI PMI editors managing dynamic content via Strapi Admin Panel |

| External System | Purpose |
|-----------------|---------|
| **Cloudinary** | Media asset CDN — stores and serves images, logos, flags, avatars |
| **Algolia** | Global search index — 6 content types searchable via proxy API |

## Design Rules

- **Single user persona** — Same users access both web and mobile; Pengguna = all 4 PMI types
- **No direct external access** — Users never call Cloudinary or Algolia directly
- **Search proxied** — All search queries go through the platform, never directly to Algolia
- **Media proxied** — All media uploads and delivery handled through the platform via Cloudinary
