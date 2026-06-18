# Google Sheets Data Table in Content Entity

## Overview

Allow individual Content entities to optionally embed an interactive data table sourced from a **published Google Sheet (CSV)**. Different entities can have different tables (different columns auto-detected from the sheet's header row), and not all entities need a table.

```
┌──────────────────────────────────────────────────────┐
│ Editor flow                                          │
│ 1. Create Google Sheet → Publish to web (CSV)        │
│ 2. Paste CSV URL into Strapi Content entity          │
│ 3. Frontend fetches CSV → renders interactive table  │
└──────────────────────────────────────────────────────┘
```

**Zero-cost** — no Google Cloud project or API key needed. Just a standard Google account to create/publish sheets.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Strapi Admin (Editor)                                    │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Content Entity                                       │ │
│ │ ├── title: "Visa Requirements"                       │ │
│ │ ├── body: CKEditor5                                 │ │
│ │ │   <p>Here are the fees for each country.</p>       │ │
│ │ │   [g-sheet]          ← editor types this marker    │ │
│ │ │   <p>Note: prices may change.</p>                 │ │
│ │ │   [g-sheet]          ← another table marker        │ │
│ │ │   <h3>FAQ</h3><p>...</p>                          │ │
│ │ └── blocks (dynamic zone)  ← NEW                     │ │
│ │     ├── Google Sheet #1   ← replaces 1st [g-sheet]   │ │
│ │     │   ├── title: "Visa Fee Comparison"             │ │
│ │     │   ├── published_url: "https://..."             │ │
│ │     │   └── enable_* toggles                         │ │
│ │     └── Google Sheet #2   ← replaces 2nd [g-sheet]   │ │
│ │         ├── title: "Embassy Contacts"                │ │
│ │         ├── published_url: "https://..."             │ │
│ │         └── enable_* toggles                         │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │ REST API GET /api/contents/:slug?populate=blocks
                       ▼
┌──────────────────────────────────────────────────────────┐
│ Frontend (Express + EJS)                                 │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Server-side (EJS template):                          │ │
│ │   bodyHtml = content.body                            │ │
│ │   for each block in content.blocks:                  │ │
│ │     replace first "[g-sheet]" with                   │ │
│ │     <div class="pmi-google-sheet-table" ...>         │ │
│ │       <table data-url="..." data-search="..." ...>   │ │
│ │         <thead></thead><tbody></tbody>               │ │
│ │       </table>                                       │ │
│ │     </div>                                           │ │
│ │   render bodyHtml                                    │ │
│ │                                                      │ │
│ │ Client-side (main.js):                               │ │
│ │   for each .pmi-google-sheet-table:                  │ │
│ │     1. fetch CSV from data-url                       │ │
│ │     2. Papa.parse(csv) → { fields, data }            │ │
│ │     3. $(table).DataTable({ data, columns })         │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### How the Shortcode Works

The editor types `[g-sheet]` in the CKEditor body at the exact position where the table should appear. On the frontend, the server-side EJS template replaces each `[g-sheet]` marker with the corresponding Google Sheet block from the dynamic zone — in order (first marker → `blocks[0]`, second → `blocks[1]`, etc.).

| Scenario | Behavior |
|---|---|
| Markers = blocks | Each `[g-sheet]` replaced with its corresponding block |
| More markers than blocks | Extra markers are stripped (no empty table) |
| More blocks than markers | Extra blocks appended at end of body |
| No markers, but has blocks | All blocks appended at end of body (graceful fallback) |
| Markers but no blocks | Markers stripped (no broken UI) |
| No markers, no blocks | Body renders normally — zero overhead |

---

## Part A — Strapi (Backend)

### A1. New Component: `content.google-sheet`

**Create via Content-Type Builder > Components > `content` category > `google-sheet`:**

| # | Field | Type | Required | Default |
|---|-------|------|----------|---------|
| 1 | `title` | Text (string) | No | — |
| 2 | `published_url` | Text (string) | **Yes** | — |
| 3 | `enable_search` | Boolean | — | `true` |
| 4 | `enable_filter` | Boolean | — | `true` |
| 5 | `enable_sort` | Boolean | — | `true` |

Equivalent JSON schema (`src/components/content/google-sheet.json`):

```jsonc
{
  "collectionName": "components_content_google_sheets",
  "info": {
    "displayName": "Google Sheet",
    "icon": "table",
    "description": "Embed a published Google Sheet as an interactive data table"
  },
  "options": {},
  "attributes": {
    "title":           { "type": "string" },
    "published_url":   { "type": "string", "required": true },
    "enable_search":   { "type": "boolean", "default": true },
    "enable_filter":   { "type": "boolean", "default": true },
    "enable_sort":     { "type": "boolean", "default": true }
  }
}
```

Columns are **auto-detected** from the sheet's header row (row 1). No manual column configuration needed.

### A2. Add `blocks` Dynamic Zone to Content

Add a new field to `Content` content type:

```
Field name:  blocks
Type:        Dynamic Zone
Components:  content.google-sheet
```

Equivalent schema diff (in `src/api/content/content-types/content/schema.json`):

```diff
"body": { "type": "customField", "customField": "plugin::ckeditor5.CKEditor", ... },
+"blocks": {
+  "type": "dynamiczone",
+  "components": ["content.google-sheet"]
+},
```

> Can be done via **Content-Type Builder > Content** UI — add field, type "Dynamic Zone", select the component.

### A3. No Backend Code Changes

| Concern | Status |
|---|---|
| Controller | Core controller serializes dynamic zones automatically |
| Service | Core service handles CRUD |
| Routes | `populate=blocks` includes blocks in response |
| Redis Cache | Content is already cached at `/api/contents` (600s TTL). `blocks` is just more JSON. |
| Algolia | `body` is the indexed textField. `blocks` is outside config — no impact. |
| Invalidation | Existing `api::content.content` invalidation rules cover `contents` + `content-groups`. |

---

### A4. API Response Shape

`GET /api/contents?populate=blocks` (or `populate=*`):

```json
{
  "data": [
    {
      "id": 5,
      "title": "Visa Requirements",
      "slug": "visa-requirements",
      "body": "<p>Below are the current visa fees...</p>",
      "blocks": [
        {
          "__component": "content.google-sheet",
          "id": 3,
          "title": "Visa Fee Comparison",
          "published_url": "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv",
          "enable_search": true,
          "enable_filter": true,
          "enable_sort": true
        }
      ]
    }
  ]
}
```

---

## Part B — Frontend (jaripmi-landing)

### Stack Context

| Layer | Technology |
|---|---|
| Framework | Express.js + EJS (SSR, no React/Vue) |
| CSS | Bootstrap 5 + custom Sass (`src/jaripmi.scss`) |
| Client JS | jQuery + Bootstrap JS (webpack `src/bundle.js`) + vanilla JS (`public/scripts/main.js`) |
| API client | Axios (server-side HTTP → Strapi REST) |
| Caching | Redis via `utils/cache-redis.js` |
| Existing table | DataTables v2.1.8 CDN already in `html_head.ejs:62` and `html_foot.ejs:12-13` — **commented out** |

### B1. Controller: Populate `blocks`

**File:** `controllers/informasiPMIController.js:119-126`

```diff
function fetchContentCategoryList(categorySlug) {
  return axiosInstance.get(buildStrapiUrl('contents', {
    filters: { content_group: { slug: { $in: [categorySlug] } } },
-   populate: ['image', 'content_group', 'icon'],
+   populate: ['image', 'content_group', 'icon', 'blocks'],
    sort: { order: 'asc' }
  })).then(r => r.data.data || []);
}
```

After this change, each content object in `contentCategoryList` will include the `blocks` array when fetched.

### B2. EJS Template: Replace Shortcodes with Table Containers

**File:** `views/informasi-pmi/pmi-component/detail-category-content.ejs`

Replace the existing body rendering logic (around lines 83-97) with the following. Instead of simply `<p><%- contentDetail.body %></p>`, the body is processed server-side to replace `[g-sheet]` markers with table containers.

**Current code** (lines 83-97):

```ejs
<% if (!contentDetail) { %>
<p>Konten tidak ditemukan.</p>
<% } else { %>
<section class="pmi-scrollspy-content adjust-anchor" id="<%= contentDetail.slug %>">
    <h4><%= contentDetail.title %></h4>
    <% if (contentDetail.image) { %>
    <img src="<%= contentDetail.image.url %>" alt="<%= contentDetail.title %>" class="img-fluid mb-3">
    <% } %>
    <div class="row">
    <div class="col-lg-12 content-article">
        <p><%- contentDetail.body %></p>
    </div>
    </div>
</section>
<% } %>
```

**Replace with:**

```ejs
<% if (!contentDetail) { %>
<p>Konten tidak ditemukan.</p>
<% } else { %>
<section class="pmi-scrollspy-content adjust-anchor" id="<%= contentDetail.slug %>">
    <h4><%= contentDetail.title %></h4>
    <% if (contentDetail.image) { %>
    <img src="<%= contentDetail.image.url %>" alt="<%= contentDetail.title %>" class="img-fluid mb-3">
    <% } %>
    <div class="row">
    <div class="col-lg-12 content-article">
      <%
        // Collect google-sheet blocks and any remaining (non-sheet) blocks
        var sheetBlocks = [];
        var otherBlocks = [];
        if (contentDetail.blocks) {
          contentDetail.blocks.forEach(function (b) {
            if (b.__component === 'content.google-sheet') {
              sheetBlocks.push(b);
            } else {
              otherBlocks.push(b);
            }
          });
        }

        // Replace [g-sheet] markers in the body with table containers
        var bodyHtml = contentDetail.body;
        var marker = /\[g-sheet\]/;
        var replacedCount = 0;

        sheetBlocks.forEach(function (block) {
          var id = replacedCount;
          var blockHtml =
            '<div class="pmi-google-sheet-block my-4">' +
              (block.title ? '<h5 class="mb-3">' + block.title + '</h5>' : '') +
              '<div class="table-responsive rounded border">' +
                '<table class="table table-striped table-hover pmi-google-sheet-table mb-0" ' +
                  'id="gsheet-table-' + id + '" ' +
                  'data-url="' + block.published_url + '" ' +
                  'data-search="' + (block.enable_search !== false) + '" ' +
                  'data-sort="' + (block.enable_sort !== false) + '" ' +
                  'data-filter="' + (block.enable_filter !== false) + '" ' +
                  'width="100%">' +
                  '<thead></thead><tbody></tbody>' +
                '</table>' +
              '</div>' +
            '</div>';
          bodyHtml = bodyHtml.replace(marker, blockHtml);
          replacedCount++;
        });

        // Strip any leftover [g-sheet] markers (more markers than blocks)
        bodyHtml = bodyHtml.replace(marker, '');

        // If no markers were replaced but blocks exist, append at end
        if (replacedCount === 0 && sheetBlocks.length > 0) {
          var fallbackHtml = '<div class="pmi-google-sheet mt-4">';
          sheetBlocks.forEach(function (block, i) {
            fallbackHtml +=
              '<div class="pmi-google-sheet-block mb-5">' +
                (block.title ? '<h5 class="mb-3">' + block.title + '</h5>' : '') +
                '<div class="table-responsive rounded border">' +
                  '<table class="table table-striped table-hover pmi-google-sheet-table mb-0" ' +
                    'id="gsheet-table-' + i + '" ' +
                    'data-url="' + block.published_url + '" ' +
                    'data-search="' + (block.enable_search !== false) + '" ' +
                    'data-sort="' + (block.enable_sort !== false) + '" ' +
                    'data-filter="' + (block.enable_filter !== false) + '" ' +
                    'width="100%">' +
                    '<thead></thead><tbody></tbody>' +
                  '</table>' +
                '</div>' +
              '</div>';
          });
          fallbackHtml += '</div>';
          bodyHtml += fallbackHtml;
        }
      %>
        <%- bodyHtml %>
    </div>
    </div>
</section>
<% } %>
```

> **No new EJS partial file needed.** The table container HTML is generated inline during shortcode replacement.

### B3. Enable DataTables CDN + Add PapaParse

**File:** `views/layouts/html_head.ejs:62`

```diff
- <!-- <link rel="stylesheet" href="https://cdn.datatables.net/2.1.8/css/dataTables.bootstrap5.css"> -->
+ <link rel="stylesheet" href="https://cdn.datatables.net/2.1.8/css/dataTables.bootstrap5.css">
```

**File:** `views/layouts/html_foot.ejs:12-13`

```diff
- <!-- <script src="https://cdn.datatables.net/2.1.8/js/jquery.dataTables.min.js"></script>
- <script src="https://cdn.datatables.net/2.1.8/js/dataTables.bootstrap5.min.js"></script> -->
+ <script src="https://cdn.datatables.net/2.1.8/js/jquery.dataTables.min.js"></script>
+ <script src="https://cdn.datatables.net/2.1.8/js/dataTables.bootstrap5.min.js"></script>
+ <script src="https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js"></script>
```

- DataTables v2.1.8 + Bootstrap 5 styling — already referenced, just uncommented.
- PapaParse v5 — added for client-side CSV parsing.
- jQuery already loaded at line 10 of `html_foot.ejs`.

### B4. Client-Side JS: Google Sheet Table Initializer

**File:** `public/scripts/main.js` (append at end)

```js
/**
 * Initialize Google Sheets data tables.
 *
 * Finds all .pmi-google-sheet-table elements, reads the published_url
 * data attribute, fetches the CSV, parses it with PapaParse, and
 * initializes a DataTable with search/sort/pagination.
 */
function initGoogleSheetTables() {
  $('.pmi-google-sheet-table').each(function () {
    var $table = $(this);
    var url = $table.data('url');
    var enableSearch = $table.data('search');
    var enableSort = $table.data('sort');

    if (!url) return;

    fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (csv) {
        var result = Papa.parse(csv, { header: true, skipEmptyLines: true });
        if (!result.data.length) {
          $table.closest('.pmi-google-sheet-block').html(
            '<div class="alert alert-info">Tabel kosong.</div>'
          );
          return;
        }

        var columns = result.meta.fields.map(function (field) {
          return { title: field, data: field };
        });

        $table.DataTable({
          data: result.data,
          columns: columns,
          searching: !!enableSearch,
          ordering: !!enableSort,
          lengthChange: false,
          pageLength: 25,
          language: {
            search: 'Cari:',
            info: 'Menampilkan _START_ sampai _END_ dari _TOTAL_ data',
            zeroRecords: 'Data tidak ditemukan',
            emptyTable: 'Tidak ada data',
            loadingRecords: 'Memuat...',
            processing: 'Memproses...'
          }
        });
      })
      .catch(function () {
        $table.closest('.pmi-google-sheet-block').html(
          '<div class="alert alert-warning">Gagal memuat data tabel. Silakan coba lagi nanti.</div>'
        );
      });
  });
}

// Run on DOM ready
$(document).ready(function () {
  initGoogleSheetTables();
});
```

#### Why DataTables

| Reason | Detail |
|---|---|
| Already referenced | CDN links exist in `html_head.ejs` and `html_foot.ejs` (commented out) |
| jQuery already loaded | DataTables jQuery plugin works with existing stack |
| Bootstrap 5 compatible | DataTables v2.1.8 has official Bootstrap 5 integration |
| Feature set | Search, sort, pagination, responsive — no code to write |
| Indonesian locale | Custom `language` config for Bahasa Indonesia labels |

### B5. Sass Styling

**File:** `src/jaripmi.scss` (append at end)

```scss
// ─── Google Sheet Data Table ─────────────────────────────────────────────────

.pmi-google-sheet {
  .pmi-google-sheet-block {
    h5 {
      color: var(--pmi-blue-700);
      font-weight: 600;
    }

    .table-responsive {
      background: white;
    }
  }

  // DataTables overrides matching Jari PMI design tokens
  .dataTables_wrapper {
    padding: 0;

    .dataTables_length,
    .dataTables_filter {
      padding: 1rem 1rem 0.5rem;
    }

    .dataTables_length label {
      color: var(--text-secondary);
    }

    .dataTables_filter {
      label {
        color: var(--text-secondary);
      }

      input {
        border-radius: var(--bs-border-radius);
        border-color: var(--border-default);
        padding: 0.375rem 0.75rem;

        &:focus {
          border-color: var(--pmi-blue-300);
          box-shadow: 0 0 0 0.2rem rgba(0, 113, 203, 0.15);
        }
      }
    }

    .dataTables_info {
      padding: 0.5rem 1rem 1rem;
      color: var(--text-disabled);
    }

    .dataTables_paginate {
      padding: 0.5rem 1rem 1rem;

      .paginate_button {
        border-radius: var(--bs-border-radius) !important;

        &.current {
          background: var(--pmi-blue-600) !important;
          border-color: var(--pmi-blue-600) !important;
          color: white !important;
        }

        &:hover {
          background: var(--pmi-blue-100) !important;
          border-color: var(--pmi-blue-200) !important;
          color: var(--pmi-blue-700) !important;
        }
      }
    }

    table.dataTable {
      thead th {
        background: var(--pmi-blue-50);
        color: var(--text-primary);
        font-weight: 600;
        border-bottom: 2px solid var(--pmi-blue-200);
      }

      tbody tr:hover {
        background-color: var(--pmi-blue-50) !important;
      }
    }
  }
}
```

---

## Part C — Editor Workflow

| Step | Action |
|---|---|
| 1 | Create Google Sheet with **headers in row 1**, data in subsequent rows |
| 2 | **File > Share > Publish to web** > Pick tab > Format: **CSV** > Publish |
| 3 | Copy the published URL (e.g. `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`) |
| 4 | In Strapi, edit a Content entity: |
| 4a | Type `[g-sheet]` in the CKEditor body where the table should appear |
| 4b | Add a **"Google Sheet"** block in the `blocks` zone (one per marker, in order) |
| 4c | Paste URL into `published_url`, optionally set title and toggles |
| 5 | Save the entity |
| 6 | Frontend replaces `[g-sheet]` with the table container, fetches CSV, renders with DataTables |

> **No API key or Google Cloud project needed.** Uses the "Publish to web" feature (available on all Google accounts).
>
> **Tip:** The `[g-sheet]` marker can be typed anywhere in the body — between paragraphs, inside a section, after an image — giving editors full control over table placement.

### Future: CKEditor Toolbar Button

A lightweight CKEditor plugin can be added later to insert `[g-sheet]` with a toolbar button click instead of manual typing. This eliminates the typo risk without changing the underlying shortcode mechanism. The `@_sh/strapi-plugin-ckeditor` package supports custom extensions, but this requires an additional build step.

---

## Part D — Verification Checklist

| # | Test | Expected |
|---|---|---|
| 1 | Create Google Sheet with headers + data, publish to web as CSV | URL returns valid CSV |
| 2 | In Strapi, add "Google Sheet" block to a Content entity, paste URL | Block saved successfully |
| 3 | `GET /api/contents?populate[blocks]=*` | Response includes `blocks` array with `published_url` |
| 4 | Type `[g-sheet]` in body, add matching Google Sheet block, save | Content entity saved |
| 5 | Visit content detail page — table appears at `[g-sheet]` position | Table renders inside body, not after it |
| 6 | Click column header | Sorts ascending, click again → descending |
| 7 | Type in search box | Filters rows across all columns in real-time |
| 8 | Test with 50+ rows | Paginates at 25 rows per page with prev/next controls |
| 9 | Test with Content that has NO Google Sheet block | Content renders normally, no empty table section |
| 10 | Test with no `[g-sheet]` marker + has blocks | Tables appended at end of body (fallback) |
| 11 | Test with more `[g-sheet]` markers than blocks | Extra markers stripped, no broken table placeholders |
| 12 | Test with 2 markers + 2 blocks in different body positions | Both tables render at correct positions |
| 13 | Test search on mobile | DataTables responsive works on mobile screens |

---

## Files Summary

### Strapi (`railway.app-strapi`)

| File | Action |
|---|---|
| `src/components/content/google-sheet.json` | **Create** — new component schema |
| `src/api/content/content-types/content/schema.json` | **Modify** — add `blocks` dynamic zone |

### Frontend (`jaripmi-landing`)

| File | Action |
|---|---|
| `controllers/informasiPMIController.js:122` | **Modify** — add `'blocks'` to populate array |
| `views/informasi-pmi/pmi-component/detail-category-content.ejs:83-97` | **Modify** — replace body rendering with shortcode replacement logic |
| `views/layouts/html_head.ejs:62` | **Modify** — uncomment DataTables CSS |
| `views/layouts/html_foot.ejs:12-13` | **Modify** — uncomment DataTables JS, add PapaParse |
| `public/scripts/main.js` | **Modify** — append `initGoogleSheetTables()` function |
| `src/jaripmi.scss` | **Modify** — append data table styles |

**Total: 7 files (~150 lines of new code).** No new partial file needed. No controller, service, route, cache, or Algolia changes needed.
