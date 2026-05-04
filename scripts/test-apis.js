#!/usr/bin/env node

require('dotenv').config();

const API_HOST = (process.env.API_HOST || 'http://localhost:1337').replace(/\/+$/, '');
const API_TOKEN = process.env.API_TOKEN || '';

const HEADERS = {
  "Content-Type": "application/json",
  ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
};

let passed = 0;
let failed = 0;
const results = [];

async function fetchAPI(endpoint) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_HOST}${endpoint}`;
  const res = await fetch(url, { headers: HEADERS });
  const body = await res.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    data = body;
  }
  return { status: res.status, ok: res.ok, data };
}

function check(test, label, ok, detail) {
  const status = ok ? 'PASS' : 'FAIL';
  const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  if (ok) passed++; else failed++;
  results.push({ label, status, test });
  const extra = !ok && detail ? ` (HTTP ${detail})` : '';
  console.log(`  ${icon} ${label} → ${status} ${test ? `| ${test}${extra}` : extra}`);
}

function summarize() {
  const total = passed + failed;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${total} total`);
  console.log(`${"─".repeat(60)}`);
  if (failed > 0) process.exit(1);
}

// ── Resolve dynamic values ──────────────────────────────────────────────

async function resolve() {
  console.log("\n🔍 Resolving dynamic values...\n");

  const vals = {};

  // personas
  const personas = await fetchAPI(
    "/api/personas?sort=order:asc&pagination[pageSize]=1",
  );
  if (personas.ok && personas.data?.data?.[0]) {
    vals.personaSlug = personas.data.data[0].slug;
    console.log(`  persona slug: ${vals.personaSlug}`);
  } else {
    vals.personaSlug = "calon-pmi";
    console.log(`  persona slug (fallback): ${vals.personaSlug}`);
  }

  // countries
  const countries = await fetchAPI(
    "/api/countries?sort=order:asc&pagination[pageSize]=1",
  );
  if (countries.ok && countries.data?.data?.[0]) {
    vals.countrySlug = countries.data.data[0].slug;
    console.log(`  country slug: ${vals.countrySlug}`);
  } else {
    vals.countrySlug = "malaysia";
    console.log(`  country slug (fallback): ${vals.countrySlug}`);
  }

  // content-groups
  const cgs = await fetchAPI("/api/content-groups?pagination[pageSize]=1");
  if (cgs.ok && cgs.data?.data?.[0]) {
    vals.contentGroupSlug = cgs.data.data[0].slug;
    vals.contentGroupId = cgs.data.data[0].documentId;
    console.log(
      `  content-group slug: ${vals.contentGroupSlug}, id: ${vals.contentGroupId}`,
    );
  } else {
    vals.contentGroupSlug = "persiapan-sebelum-berangkat";
    vals.contentGroupId = "1";
    console.log(`  content-group slug (fallback): ${vals.contentGroupSlug}`);
  }

  // service-infos
  const svcs = await fetchAPI("/api/service-infos?pagination[pageSize]=1");
  if (svcs.ok && svcs.data?.data?.[0]) {
    vals.serviceInfoSlug = svcs.data.data[0].slug;
    console.log(`  service-info slug: ${vals.serviceInfoSlug}`);
  } else {
    vals.serviceInfoSlug = "qris-cross-border";
    console.log(`  service-info slug (fallback): ${vals.serviceInfoSlug}`);
  }

  // courses
  const courses = await fetchAPI("/api/courses?pagination[pageSize]=1");
  if (courses.ok && courses.data?.data?.[0]) {
    vals.courseId = courses.data.data[0].documentId;
    console.log(`  course id: ${vals.courseId}`);
  } else {
    vals.courseId = "1";
    console.log(`  course id (fallback): ${vals.courseId}`);
  }

  // contents
  const contents = await fetchAPI("/api/contents?pagination[pageSize]=1");
  if (contents.ok && contents.data?.data?.[0]) {
    vals.contentId = contents.data.data[0].documentId;
    console.log(`  content id: ${vals.contentId}`);
  } else {
    vals.contentId = "1";
    console.log(`  content id (fallback): ${vals.contentId}`);
  }

  return vals;
}

// ── Test suites ──────────────────────────────────────────────────────────

async function run() {
  const v = await resolve();

  console.log(`\n${"─".repeat(60)}`);
  console.log(`\n🧪 Testing APIs (${API_HOST})\n`);

  // ── Home ──────────────────────────────────────────────────────────────

  console.log("── Home ──");
  {
    const r = await fetchAPI("/api/personas?populate=*&sort=order:asc");
    check("GET /api/personas", "Modal Persona Selector", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/search?q=test");
    check("GET /api/search", "Section Search", r.ok, r.status);
  }
  {
    const r = await fetchAPI(
      "/api/service-infos?filters[link][$notNull]=true&populate=*&status=published",
    );
    check("GET /api/service-infos", "Section Informasi Layanan", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/countries?populate=*&sort=order:asc");
    check("GET /api/countries", "Section Negara Tujuan", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/courses?populate=*&status=published");
    check("GET /api/courses", "Section Pelatihan Untuk Kamu", r.ok, r.status);
  }
  {
    const r = await fetchAPI(
      "/api/articles?populate=*&status=published&sort=createdAt:desc&pagination[pageSize]=10",
    );
    check("GET /api/articles", "Section Artikel Terbaru", r.ok, r.status);
  }

  // ── Informasi PMI (Persona Page) ──────────────────────────────────────

  console.log("\n── Informasi PMI (Persona Page) ──");
  {
    const r = await fetchAPI(
      `/api/personas?filters[slug][$eq]=${v.personaSlug}&populate=*`,
    );
    check(`GET /api/personas (slug=${v.personaSlug})`, "Hero", r.ok, r.status);
  }
  {
    const r = await fetchAPI(
      `/api/content-groups?filters[personas][slug][$eq]=${v.personaSlug}&populate[contents][populate]=image&populate[service_infos][populate]=cover_image&populate[protection_infos][populate]=icon&populate[courses][populate]=image&populate[countries][populate]=*&sort=order:asc&status=published`,
    );
    check(
      `GET /api/content-groups (filter by persona=${v.personaSlug})`,
      "Section Pilihan informasi",
      r.ok, r.status,
    );
  }
  {
    const r = await fetchAPI("/api/protection-infos?populate=*&sort=order:asc");
    check("GET /api/protection-infos", "Section Penting Diketahui", r.ok, r.status);
  }
  {
    const r = await fetchAPI(
      `/api/tools?filters[personas][slug][$eq]=${v.personaSlug}&populate=*`,
    );
    check(
      `GET /api/tools (filter by persona=${v.personaSlug})`,
      "Section Alat Bantu Interaktif",
      r.ok, r.status,
    );
  }

  // ── Page Detail Informasi dari Pilihan Informasi ──────────────────────

  console.log("\n── Page Detail Informasi dari Pilihan Informasi ──");
  {
    const r = await fetchAPI(
      `/api/content-groups?filters[slug][$eq]=${v.contentGroupSlug}&populate=*&status=published`,
    );
    check(
      `GET /api/content-groups (slug=${v.contentGroupSlug})`,
      "Section Hero",
      r.ok, r.status,
    );
  }
  {
    const r = await fetchAPI(
      `/api/contents?filters[content_group][documentId][$eq]=${v.contentGroupId}&populate=*&status=published&sort=order:asc`,
    );
    check(
      `GET /api/contents (filter by content-group=${v.contentGroupId})`,
      "Section Content",
      r.ok, r.status,
    );
  }

  // ── Page Detail Negara Tujuan ─────────────────────────────────────────

  console.log("\n── Page Detail Negara Tujuan ──");
  {
    const r = await fetchAPI(
      `/api/countries?filters[slug][$eq]=${v.countrySlug}&populate=*`,
    );
    check(
      `GET /api/countries (slug=${v.countrySlug})`,
      "Section Penjelasan",
      r.ok, r.status,
    );
  }
  {
    const r = await fetchAPI(
      `/api/content-groups?filters[countries][slug][$eq]=${v.countrySlug}&populate[contents][populate]=image&sort=order:asc&status=published`,
    );
    check(
      `GET /api/content-groups (filter by country=${v.countrySlug})`,
      "Section Pilihan informasi",
      r.ok, r.status,
    );
  }

  // ── Page Informasi Keuangan ───────────────────────────────────────────

  console.log("\n── Page Informasi Keuangan ──");
  {
    const r = await fetchAPI(
      `/api/service-infos?filters[slug][$eq]=${v.serviceInfoSlug}&populate=*&status=published`,
    );
    check(
      `GET /api/service-infos (slug=${v.serviceInfoSlug})`,
      "Section Penjelasan",
      r.ok, r.status,
    );
  }
  {
    const r = await fetchAPI(
      `/api/content-groups?filters[service_infos][slug][$eq]=${v.serviceInfoSlug}&populate[contents][populate]=image&sort=order:asc&status=published`,
    );
    check(
      `GET /api/content-groups (filter by service-info=${v.serviceInfoSlug})`,
      "Section Pilihan informasi",
      r.ok, r.status,
    );
  }

  // ── Page Pelatihan ────────────────────────────────────────────────────

  console.log("\n── Page Pelatihan ──");
  {
    const r = await fetchAPI(
      "/api/courses?populate=*&status=published&pagination[page]=1&pagination[pageSize]=25&sort=name:asc",
    );
    check("GET /api/courses", "Section List Pelatihan", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/search?q=pelatihan&type=course");
    check("GET /api/search (type=course)", "Search pelatihan", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/course-categories?populate=*");
    check("GET /api/course-categories", "Section List category", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/learning-platforms?populate=*");
    check(
      "GET /api/learning-platforms",
      "Section List Lembaga Pelatihan",
      r.ok, r.status,
    );
  }

  // ── Page Pelatihan Detail ─────────────────────────────────────────────

  console.log("\n── Page Pelatihan Detail ──");
  {
    const hasCourse = v.courseId !== '1';
    const r = await fetchAPI(`/api/courses/${v.courseId}?populate=*`);
    if (!hasCourse && r.status === 404) {
      check(`GET /api/courses/{id}`, 'Section pelatihan (skip: no data)', true);
    } else {
      check(`GET /api/courses/${v.courseId}`, 'Section pelatihan', r.ok, r.status);
    }
  }

  // ── Page Artikel ──────────────────────────────────────────────────────

  console.log("\n── Page Artikel ──");
  {
    const r = await fetchAPI(
      "/api/articles?populate=*&status=published&pagination[page]=1&pagination[pageSize]=25&sort=createdAt:desc",
    );
    check("GET /api/articles", "Section List artikel", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/search?q=berita&type=article");
    check("GET /api/search (type=article)", "Search artikel", r.ok, r.status);
  }
  {
    const r = await fetchAPI("/api/article-categories?populate=*");
    check("GET /api/article-categories", "Section list kategori", r.ok, r.status);
  }

  // ── Summary ───────────────────────────────────────────────────────────

  summarize();
}

run().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
