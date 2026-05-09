// @ts-nocheck - Seeding module called from bootstrap lifecycle

const TABLE_MAP: Record<string, { uid: string; deps: string[]; fn: string }> = {
  'article-categories': { uid: 'api::article-category.article-category', deps: [], fn: 'seedArticleCategories' },
  'article-tags': { uid: 'api::article-tag.article-tag', deps: [], fn: 'seedArticleTags' },
  'course-categories': { uid: 'api::course-category.course-category', deps: [], fn: 'seedCourseCategories' },
  'course-tags': { uid: 'api::course-tag.course-tag', deps: [], fn: 'seedCourseTags' },
  'learning-platforms': { uid: 'api::learning-platform.learning-platform', deps: [], fn: 'seedLearningPlatforms' },
  'course-learning-methods': { uid: 'api::course-learning-method.course-learning-method', deps: [], fn: 'seedCourseLearningMethods' },
  'authors': { uid: 'api::author.author', deps: [], fn: 'seedAuthors' },
  'personas': { uid: 'api::persona.persona', deps: [], fn: 'seedPersonas' },
  'pages': { uid: 'api::page.page', deps: [], fn: 'seedPages' },
  'countries': { uid: 'api::country.country', deps: [], fn: 'seedCountries' },
  'faqs': { uid: 'api::faq.faq', deps: [], fn: 'seedFaqs' },
  'provinces': { uid: 'api::province.province', deps: [], fn: 'seedProvinces' },
  'service-infos': { uid: 'api::service-info.service-info', deps: ['countries'], fn: 'seedServiceInfos' },
  'purna-pmis': { uid: 'api::purna-pmi.purna-pmi', deps: ['provinces'], fn: 'seedPurnaPmis' },
  'articles': { uid: 'api::article.article', deps: ['article-categories', 'article-tags', 'authors'], fn: 'seedArticles' },
  'courses': { uid: 'api::course.course', deps: ['course-categories', 'course-tags', 'learning-platforms', 'course-learning-methods'], fn: 'seedCourses' },
  'curriculums': { uid: 'api::curriculum.curriculum', deps: ['courses'], fn: 'seedCurriculums' },
  'alerts': { uid: 'api::alert.alert', deps: ['pages'], fn: 'seedAlerts' },
  'announcements': { uid: 'api::announcement.announcement', deps: ['personas'], fn: 'seedAnnouncements' },
  'content-groups': { uid: 'api::content-group.content-group', deps: ['personas', 'countries'], fn: 'seedContentGroups' },
  'contents': { uid: 'api::content.content', deps: ['content-groups'], fn: 'seedContents' },
  'global': { uid: 'api::global.global', deps: [], fn: 'seedGlobal' },
  'tools': { uid: 'api::tool.tool', deps: ['personas'], fn: 'seedTools' },
};

function resolveSeedTables(selected: string[]): string[] {
  const resolved = new Set<string>();
  function add(table: string) {
    if (resolved.has(table)) return;
    resolved.add(table);
    const config = TABLE_MAP[table];
    if (config) {
      for (const dep of config.deps) add(dep);
    }
  }
  for (const t of selected) {
    if (!TABLE_MAP[t]) {
      console.warn(`Unknown table: "${t}". Available: ${Object.keys(TABLE_MAP).join(', ')}`);
      continue;
    }
    add(t);
  }
  return [...resolved];
}

export async function seed(strapi) {
  const selectedTables = process.env.SEED_TABLES?.split(',').map(t => t.trim()).filter(Boolean);

  if (selectedTables?.length) {
    const resolved = resolveSeedTables(selectedTables);
    if (!resolved.length) {
      console.log('No valid tables to seed.');
      return;
    }
    console.log(`Seeding tables: ${resolved.join(', ')} (requested: ${selectedTables.join(', ')})`);

    const client = strapi.config.get('database.connection.client');
    const db = strapi.db;

    for (const table of resolved) {
      const uid = TABLE_MAP[table].uid;
      try {
        if (client === 'postgres' || client === 'pg') {
          await db.connection.raw(`DELETE FROM "${uid.split('::')[1].replace(/\./g, '_') || uid}"`);
        } else {
          const docs = await strapi.documents(uid).findMany({ limit: 10000 });
          for (const d of docs) {
            await strapi.documents(uid).delete(d.documentId);
          }
        }
      } catch {
        // Skip if delete fails (table may not exist yet)
      }
    }
    console.log('Cleaned selected tables.\n')

    const ids = {};
    for (const table of resolved) {
      const fnName = TABLE_MAP[table].fn;
      const needsIds = ['seedServiceInfos', 'seedArticles', 'seedCourses',
        'seedCurriculums', 'seedAlerts', 'seedAnnouncements', 'seedContentGroups', 'seedContents', 'seedTools', 'seedPurnaPmis'].includes(fnName);
      const fn = needsIds ? await (async () => {
        switch (fnName) {
          case 'seedServiceInfos': return seedServiceInfos(strapi, ids);
          case 'seedArticles': return seedArticles(strapi, ids);
          case 'seedCourses': return seedCourses(strapi, ids);
          case 'seedCurriculums': return seedCurriculums(strapi, ids);
          case 'seedAlerts': return seedAlerts(strapi, ids);
          case 'seedAnnouncements': return seedAnnouncements(strapi, ids);
          case 'seedContentGroups': return seedContentGroups(strapi, ids);
          case 'seedContents': return seedContents(strapi, ids);
          case 'seedTools': return seedTools(strapi, ids);
          case 'seedPurnaPmis': return seedPurnaPmis(strapi, ids);
          default: return {};
        }
      })() : await (async () => {
        switch (fnName) {
          case 'seedArticleCategories': return seedArticleCategories(strapi);
          case 'seedArticleTags': return seedArticleTags(strapi);
          case 'seedCourseCategories': return seedCourseCategories(strapi);
          case 'seedCourseTags': return seedCourseTags(strapi);
          case 'seedLearningPlatforms': return seedLearningPlatforms(strapi);
          case 'seedCourseLearningMethods': return seedCourseLearningMethods(strapi);
          case 'seedAuthors': return seedAuthors(strapi);
          case 'seedPersonas': return seedPersonas(strapi);
          case 'seedPages': return seedPages(strapi);
          case 'seedCountries': return seedCountries(strapi);
          case 'seedFaqs': return seedFaqs(strapi);
          case 'seedProvinces': return seedProvinces(strapi);
          case 'seedGlobal': return seedGlobal(strapi);
          default: return {};
        }
      })();
      ids[table] = fn;
    }
    console.log(`\nSeeded ${resolved.length} tables.`);
    return;
  }

  // Full seed (no SEED_TABLES set)
  await cleanDatabase(strapi);
  console.log('');

  const ids = {};

  ids.articleCategories = await seedArticleCategories(strapi)
  ids.articleTags = await seedArticleTags(strapi)
  ids.courseCategories = await seedCourseCategories(strapi)
  ids.courseTags = await seedCourseTags(strapi)
  ids.learningPlatforms = await seedLearningPlatforms(strapi)
  ids.courseLearningMethods = await seedCourseLearningMethods(strapi)
  ids.authors = await seedAuthors(strapi)
  ids.personas = await seedPersonas(strapi)
  ids.pages = await seedPages(strapi)
  ids.countries = await seedCountries(strapi)
  ids.faqs = await seedFaqs(strapi)
  ids.provinces = await seedProvinces(strapi)

  console.log('')
  ids.serviceInfos = await seedServiceInfos(strapi, ids)
  ids.articles = await seedArticles(strapi, ids)
  ids.courses = await seedCourses(strapi, ids)
  ids.curriculums = await seedCurriculums(strapi, ids)
  ids.purnaPmis = await seedPurnaPmis(strapi, ids)
  await seedAlerts(strapi, ids)
  ids.announcements = await seedAnnouncements(strapi, ids)

  console.log('')
  ids.contentGroups = await seedContentGroups(strapi, ids)
  ids.contents = await seedContents(strapi, ids)

  console.log('')
  await seedGlobal(strapi)
}

async function cleanDatabase(strapi) {
  console.log('Cleaning database (preserving admin user)...')

  const client = strapi.config.get('database.connection.client')

  const tables = [
    'articles_article_category_lnk', 'articles_article_tags_lnk', 'articles_author_lnk',
    'content_groups_contents_lnk', 'content_groups_countries_lnk', 'content_groups_service_infos_lnk',
    'content_groups_personas_lnk',
    'service_infos_countries_lnk', 'files_related_mph', 'files_folder_lnk',
    'content_groups', 'contents', 'articles', 'curriculums', 'courses', 'service_infos', 'alerts', 'announcements',
    'authors', 'countries', 'personas', 'provinces', 'purna_pmis', 'faqs',
    'article_categories', 'article_tags',
    'course_categories', 'course_tags', 'learning_platforms', 'course_learning_methods',
    'files', 'upload_folders',
    'global', 'homepage', 'pages',
    'components_layout_footer_columns', 'components_layout_footer_columns_cmps',
    'components_layout_social_links', 'components_section_heroes', 'components_section_persona_cards',
    'components_shared_links', 'components_shared_seos',
  ]

  const db = strapi.db

  if (client === 'postgres' || client === 'pg') {
    const quotedTables = tables.map(t => `"${t}"`).join(',')
    try {
      await db.connection.raw(`TRUNCATE ${quotedTables} CASCADE`)
    } catch {
      for (const table of tables) {
        try { await db.connection(table).del() } catch {}
      }
    }
  } else {
    for (const table of tables) {
      try { await db.connection(table).del() } catch {}
    }
  }

  console.log('Database cleaned.')
}

async function seedArticleCategories(strapi) {
  console.log('Seeding article categories...')
  const uid = 'api::article-category.article-category'
  const items = [
    { name: 'Berita', slug: 'berita', description: '<p>Berita terbaru seputar PMI</p>' },
    { name: 'Ketenagakerjaan', slug: 'ketenagakerjaan', description: '<p>Informasi ketenagakerjaan</p>' },
    { name: 'Perlindungan', slug: 'perlindungan', description: '<p>Informasi perlindungan PMI</p>' },
    { name: 'Tips & Panduan', slug: 'tips-dan-panduan', description: '<p>Tips dan panduan untuk PMI</p>' },
  ]
  const ids = {}
  for (const item of items) {
    try {
      const doc = await strapi.documents(uid).create({ data: item })
      ids[item.slug] = doc.documentId
    } catch (err) {
      console.error(`  ERROR creating "${item.name}":`, err.message || err)
      if (err.details?.errors) { for (const e of err.details.errors) { console.error(`    - ${e.path?.join('.')}: ${e.message}`) } }
      throw err
    }
  }
  console.log(`  Created ${items.length} article categories`)
  return ids
}

async function seedArticleTags(strapi) {
  console.log('Seeding article tags...')
  const uid = 'api::article-tag.article-tag'
  const items = [
    { name: 'Migrasi', slug: 'migrasi' },
    { name: 'Hukum', slug: 'hukum' },
    { name: 'Kesehatan', slug: 'kesehatan' },
    { name: 'Pelatihan', slug: 'pelatihan' },
    { name: 'Dokumentasi', slug: 'dokumentasi' },
    { name: 'Hak Pekerja', slug: 'hak-pekerja' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} article tags`)
  return ids
}

async function seedCourseCategories(strapi) {
  console.log('Seeding course categories...')
  const uid = 'api::course-category.course-category'
  const items = [
    { name: 'Keselamatan & K3', slug: 'keselamatan-dan-k3' },
    { name: 'Bahasa', slug: 'bahasa' },
    { name: 'Keterampilan', slug: 'keterampilan' },
    { name: 'Manajemen Keuangan', slug: 'manajemen-keuangan' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} course categories`)
  return ids
}

async function seedCourseTags(strapi) {
  console.log('Seeding course tags...')
  const uid = 'api::course-tag.course-tag'
  const items = [
    { name: 'Gratis', slug: 'gratis' },
    { name: 'Bersertifikat', slug: 'bersertifikat' },
    { name: 'Online', slug: 'online' },
    { name: 'Offline', slug: 'offline' },
    { name: 'Mandiri', slug: 'mandiri' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} course tags`)
  return ids
}

async function seedLearningPlatforms(strapi) {
  console.log('Seeding learning platforms...')
  const uid = 'api::learning-platform.learning-platform'
  const items = [
    { name: 'BP2MI', slug: 'bp2mi', url: 'https://bp2mi.go.id' },
    { name: 'P2MI Online', slug: 'p2mi-online', url: 'https://p2mionline.kemnaker.go.id' },
    { name: 'Lembaga Pelatihan Terakreditasi', slug: 'lembaga-pelatihan-terakreditasi', url: '' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} learning platforms`)
  return ids
}

async function seedCourseLearningMethods(strapi) {
  console.log('Seeding course learning methods...')
  const uid = 'api::course-learning-method.course-learning-method'
  const items = [
    { name: 'Offline', slug: 'offline' },
    { name: 'Webinar', slug: 'webinar' },
    { name: 'Self-Paced', slug: 'self-paced' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} course learning methods`)
  return ids
}

async function seedAuthors(strapi) {
  console.log('Seeding authors...')
  const uid = 'api::author.author'
  const items = [
    { name: 'Admin JARI PMI', slug: 'admin-jari-pmi', bio: 'Tim redaksi JARI PMI' },
    { name: 'Redaksi JARI PMI', slug: 'redaksi-jari-pmi', bio: 'Kontributor berita dan informasi PMI' },
  ]
  const ids = {}
  for (const item of items) {
    console.log(`  Creating author: ${item.name}`)
    try {
      const doc = await strapi.documents(uid).create({ data: item })
      console.log(`  Created author: ${item.name} -> ${doc.documentId}`)
      ids[item.slug] = doc.documentId
    } catch (err) {
      console.error(`  ERROR creating author "${item.name}":`, err.message || err)
      if (err.details?.errors) { for (const e of err.details.errors) { console.error(`    - ${e.path?.join('.')}: ${e.message}`) } }
      throw err
    }
  }
  console.log(`  Created ${items.length} authors`)
  return ids
}

async function seedPersonas(strapi) {
  console.log('Seeding personas...')
  const uid = 'api::persona.persona'
  const items = [
    { name: 'Calon PMI', slug: 'calon-pmi', banner_title: 'Selamat Datang Calon PMI', banner_subtitle: 'Dapatkan informasi lengkap sebelum berangkat ke luar negeri', excerpt: 'Berencana bekerja di luar negeri', description: '<p>Program dan layanan yang dirancang khusus untuk calon Pekerja Migran Indonesia. Dapatkan informasi lengkap tentang persyaratan, dokumen, dan persiapan sebelum berangkat ke luar negeri.</p>', background_color: '#1A5276', order: 1, meta_seo: { meta_title: 'Calon PMI - JARI PMI', meta_description: 'Informasi untuk calon Pekerja Migran Indonesia' } },
    { name: 'PMI Aktif', slug: 'pmi-aktif', banner_title: 'PMI Aktif di Luar Negeri', banner_subtitle: 'Informasi dan perlindungan selama bekerja di luar negeri', excerpt: 'Sedang bekerja di luar negeri', description: '<p>Layanan dan perlindungan untuk Pekerja Migran Indonesia yang sedang aktif bekerja di luar negeri. Akses informasi tentang hak-hak pekerja, pengaduan, dan dukungan selama masa penempatan.</p>', background_color: '#117864', order: 2, meta_seo: { meta_title: 'PMI Aktif - JARI PMI', meta_description: 'Informasi untuk PMI yang sedang bekerja di luar negeri' } },
    { name: 'Keluarga PMI', slug: 'keluarga-pmi', banner_title: 'Keluarga PMI', banner_subtitle: 'Dukungan dan informasi untuk keluarga pekerja migran', excerpt: 'Keluarga pekerja migran Indonesia', description: '<p>Informasi dan dukungan untuk keluarga Pekerja Migran Indonesia. Temukan panduan komunikasi, pengelolaan keuangan, dan program pemberdayaan keluarga PMI.</p>', background_color: '#7D3C98', order: 3, meta_seo: { meta_title: 'Keluarga PMI - JARI PMI', meta_description: 'Informasi untuk keluarga Pekerja Migran Indonesia' } },
    { name: 'Purna PMI', slug: 'purna-pmi', banner_title: 'Purna PMI', banner_subtitle: 'Memulai kehidupan baru setelah bekerja di luar negeri', excerpt: 'Telah selesai bekerja di luar negeri', description: '<p>Program reintegrasi dan pemberdayaan untuk PMI yang telah selesai bekerja di luar negeri. Dapatkan informasi tentang kewirausahaan, pelatihan keterampilan, dan bantuan modal usaha.</p>', background_color: '#B7950B', order: 4, meta_seo: { meta_title: 'Purna PMI - JARI PMI', meta_description: 'Informasi untuk PMI yang telah selesai bekerja di luar negeri' } },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: { ...item } })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} personas`)
  return ids
}

async function seedCountries(strapi) {
  console.log('Seeding countries...')
  const uid = 'api::country.country'
  const items = [
    { name: 'Malaysia', slug: 'malaysia', excerpt: 'Tujuan utama PMI di Asia Tenggara', region: 'asia', is_featured: true, vacancy_count: 12000, salary_avg: 'Rp 3,5 juta/bulan', pmi_count: 800000, order: 1, description: '<p>Malaysia merupakan salah satu tujuan utama PMI dengan banyak peluang di sektor konstruksi, perkebunan, dan domestik.</p>' },
    { name: 'Arab Saudi', slug: 'arab-saudi', excerpt: 'Destinasi utama di Timur Tengah', region: 'middle-east', is_featured: true, vacancy_count: 8500, salary_avg: 'Rp 4 juta/bulan', pmi_count: 600000, order: 2, description: '<p>Arab Saudi menawarkan peluang kerja di sektor konstruksi, perawatan kesehatan, dan domestik dengan gaji yang kompetitif.</p>' },
    { name: 'Hong Kong', slug: 'hong-kong', excerpt: 'Peluang kerja domestik dan perawat', region: 'asia', is_featured: true, vacancy_count: 5000, salary_avg: 'Rp 5 juta/bulan', pmi_count: 350000, order: 3, description: '<p>Hong Kong banyak membutuhkan pekerja domestik dan perawat dari Indonesia.</p>' },
    { name: 'Taiwan', slug: 'taiwan', excerpt: 'Peluang di sektor manufaktur dan perikanan', region: 'asia', is_featured: true, vacancy_count: 6000, salary_avg: 'Rp 4,5 juta/bulan', pmi_count: 300000, order: 4, description: '<p>Taiwan menawarkan peluang kerja di sektor manufaktur, perikanan, dan domestik.</p>' },
    { name: 'Singapura', slug: 'singapura', excerpt: 'Destinasi modern dengan gaji kompetitif', region: 'asia', is_featured: true, vacancy_count: 4000, salary_avg: 'Rp 5,5 juta/bulan', pmi_count: 250000, order: 5, description: '<p>Singapura membutuhkan PMI di sektor konstruksi, domestik, dan perawatan.</p>' },
    { name: 'Korea Selatan', slug: 'korea-selatan', excerpt: 'Program EPS untuk pekerja manufaktur', region: 'asia', is_featured: false, vacancy_count: 3000, salary_avg: 'Rp 6 juta/bulan', pmi_count: 50000, order: 6, description: '<p>Korea Selatan membuka peluang kerja di sektor manufaktur dan perikanan melalui program EPS.</p>' },
    { name: 'Jepang', slug: 'jepang', excerpt: 'Program magang dan keterampilan teknis', region: 'asia', is_featured: false, vacancy_count: 2500, salary_avg: 'Rp 5 juta/bulan', pmi_count: 40000, order: 7, description: '<p>Jepang menawarkan program kerja magang dan keterampilan teknis untuk PMI Indonesia.</p>' },
    { name: 'Uni Emirates Arab', slug: 'uni-emirates-arab', excerpt: 'Peluang di sektor konstruksi dan perhotelan', region: 'middle-east', is_featured: false, vacancy_count: 7000, salary_avg: 'Rp 4 juta/bulan', pmi_count: 200000, order: 8, description: '<p>UEA membutuhkan banyak PMI di sektor konstruksi, perhotelan, dan jasa.</p>' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: { ...item } })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} countries`)
  return ids
}

async function seedServiceInfos(strapi, ids) {
  console.log('Seeding service infos...')
  const uid = 'api::service-info.service-info'

  const items = [
    { name: 'QRIS Cross Border', slug: 'qris-cross-border', excerpt: 'Bayar dan transfer uang menggunakan QRIS di negara penempatan.', description: '<p>Layanan QRIS Cross Border memungkinkan PMI untuk melakukan pembayaran dan transfer uang menggunakan kode QR di negara penempatan. Layanan ini didukung oleh Bank Indonesia dan tersedia di beberapa negara tujuan PMI.</p><p>Dengan QRIS Cross Border, Anda dapat melakukan transaksi secara mudah dan aman tanpa perlu membawa uang tunai dalam jumlah besar. Cukup scan kode QR di tempat pembayaran yang tersedia.</p>', is_featured: true, order: 1, meta_seo: { meta_title: 'QRIS Cross Border - JARI PMI', meta_description: 'Bayar dan transfer uang menggunakan QRIS di negara penempatan.' }, countries: [ids.countries['malaysia'], ids.countries['arab-saudi'], ids.countries['hong-kong']] },
    { name: 'BPJS Ketenagakerjaan', slug: 'bpjs-ketenagakerjaan', excerpt: 'Jaminan sosial tenaga kerja untuk perlindungan PMI selama bekerja di luar negeri.', description: '<p>BPJS Ketenagakerjaan memberikan jaminan sosial bagi PMI yang meliputi Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JKM), Jaminan Hari Tua (JHT), dan Jaminan Pensiun.</p><p>Pastikan Anda terdaftar sebagai peserta BPJS Ketenagakerjaan sebelum berangkat ke luar negeri. Iuran dapat dibayarkan secara berkala selama Anda bekerja di luar negeri.</p>', is_featured: true, order: 2, meta_seo: { meta_title: 'BPJS Ketenagakerjaan - JARI PMI', meta_description: 'Jaminan sosial tenaga kerja untuk perlindungan PMI.' }, countries: [ids.countries['malaysia'], ids.countries['singapura']] },
    { name: 'BLTK Online', slug: 'bltk-online', excerpt: 'Buat dan kelola Berkas Penempatan Tenaga Kerja Indonesia secara online.', description: '<p>BLTK Online adalah layanan pembuatan Berkas Penempatan Tenaga Kerja Indonesia secara digital. Melalui layanan ini, Anda dapat mengurus persyaratan penempatan tanpa perlu datang langsung ke kantor BP2MI.</p><p>Layanan ini memudahkan proses administrasi penempatan PMI dengan sistem yang terintegrasi dan transparan.</p>', is_featured: true, order: 3, meta_seo: { meta_title: 'BLTK Online - JARI PMI', meta_description: 'Buat dan kelola berkas penempatan TKI secara online.' }, countries: [ids.countries['taiwan'], ids.countries['hong-kong']] },
    { name: 'Verifikasi Dokumen PMI', slug: 'verifikasi-dokumen-pmi', excerpt: 'Verifikasi keabsahan dokumen penempatan PMI sebelum keberangkatan.', description: '<p>Layanan Verifikasi Dokumen PMI membantu Anda memastikan keabsahan seluruh dokumen penempatan sebelum berangkat ke luar negeri. Dokumen yang perlu diverifikasi antara lain kontrak kerja, visa kerja, dan izin penempatan.</p><p>Pastikan semua dokumen Anda telah diverifikasi untuk menghindari masalah di negara penempatan.</p>', is_featured: false, order: 4, meta_seo: { meta_title: 'Verifikasi Dokumen PMI - JARI PMI', meta_description: 'Verifikasi keabsahan dokumen penempatan PMI.' }, countries: [] },
  ]

  const resultIds = {}
  for (const item of items) {
    const { countries, ...data } = item
    const doc = await strapi.documents(uid).create({
      data: { ...data, countries: countries?.length ? { connect: countries.map(id => ({ documentId: id })) } : undefined },
    })
    await strapi.documents(uid).publish(doc.documentId)
    resultIds[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} service infos (published)`)
  return resultIds
}

async function seedArticles(strapi, ids) {
  console.log('Seeding articles...')
  const uid = 'api::article.article'

  const articles = [
    { title: 'Panduan Lengkap Menjadi PMI yang Terlindungi', slug: 'panduan-lengkap-menjadi-pmi-yang-terlindungi', excerpt: 'Ketahui langkah-langkah penting untuk memastikan perlindungan Anda sebagai Pekerja Migran Indonesia.', content: '<p>Menjadi Pekerja Migran Indonesia (PMI) yang terlindungi bukan hanya tentang memiliki pekerjaan di luar negeri, tetapi juga memastikan bahwa hak-hak Anda terjamin sejak awal proses penempatan.</p><p>Panduan ini mencakup persyaratan dokumen, proses penempatan yang sah, hak-hak Anda di negara penempatan, serta langkah-langkah yang harus diambil jika menghadapi masalah.</p><p>Ingatlah bahwa perlindungan dimulai sebelum Anda berangkat. Pastikan Anda menggunakan jalur resmi dan memiliki semua dokumen yang diperlukan.</p>', article_category: ids.articleCategories['perlindungan'], article_tags: { connect: [ids.articleTags['migrasi'], ids.articleTags['hukum']].map(id => ({ documentId: id })) }, author: ids.authors['admin-jari-pmi'] },
    { title: 'Tips Persiapan Dokumen Sebelum Bekerja ke Luar Negeri', slug: 'tips-persiapan-dokumen-sebelum-bekerja-ke-luar-negeri', excerpt: 'Daftar lengkap dokumen yang perlu disiapkan sebelum bekerja ke luar negeri.', content: '<p>Persiapan dokumen adalah langkah krusial sebelum bekerja ke luar negeri. Tanpa dokumen yang lengkap, Anda bisa menghadapi masalah di negara penempatan.</p><p>Dokumen yang wajib disiapkan antara lain: paspor dengan masa berlaku minimal 2 tahun, visa kerja resmi, kontrak kerja yang ditandatangani, sertifikat kesehatan, dan surat izin penempatan dari BP2MI.</p><p>Simpan salinan digital semua dokumen Anda sebagai cadangan. Gunakan layanan cloud storage agar dokumen selalu dapat diakses kapan saja.</p>', article_category: ids.articleCategories['tips-dan-panduan'], article_tags: { connect: [ids.articleTags['dokumentasi'], ids.articleTags['hak-pekerja']].map(id => ({ documentId: id })) }, author: ids.authors['redaksi-jari-pmi'] },
    { title: 'K3 di Tempat Kerja: Apa yang Harus Anda Ketahui', slug: 'k3-di-tempat-kerja-apa-yang-harus-anda-ketahui', excerpt: 'Pahami standar Keselamatan dan Kesehatan Kerja (K3) untuk PMI.', content: '<p>Keselamatan dan Kesehatan Kerja (K3) adalah hak setiap pekerja, termasuk PMI. Memahami standar K3 di negara penempatan Anda dapat menyelamatkan nyawa.</p><p>Setiap PMI berhak atas pelatihan K3 sebelum memulai pekerjaan, alat pelindung diri yang memadai, dan akses terhadap layanan kesehatan. Jika perusahaan tidak menyediakan hal-hal ini, Anda berhak mengajukan pengaduan.</p><p>Kenali tanda-tanda bahaya di tempat kerja dan jangan ragu untuk melaporkan kondisi yang tidak aman.</p>', article_category: ids.articleCategories['ketenagakerjaan'], article_tags: { connect: [ids.articleTags['kesehatan'], ids.articleTags['pelatihan']].map(id => ({ documentId: id })) }, author: ids.authors['admin-jari-pmi'] },
    { title: 'Program Pelatihan Baru dari BP2MI Tahun 2026', slug: 'program-pelatihan-baru-dari-bp2mi-tahun-2026', excerpt: 'BP2MI meluncurkan program pelatihan baru untuk meningkatkan kompetensi PMI.', content: '<p>BP2MI mengumumkan peluncuran program pelatihan baru yang dirancang untuk meningkatkan kompetensi dan kesiapan Pekerja Migran Indonesia sebelum bekerja ke luar negeri.</p><p>Program ini mencakup pelatihan bahasa, keterampilan teknis, keselamatan kerja, dan manajemen keuangan. Pelatihan tersedia secara online dan offline di berbagai Pusat Pelatihan PMI di seluruh Indonesia.</p><p>Pendaftaran dapat dilakukan melalui website resmi BP2MI atau kantor BP2MI daerah terdekat.</p>', article_category: ids.articleCategories['berita'], article_tags: { connect: [ids.articleTags['pelatihan'], ids.articleTags['migrasi']].map(id => ({ documentId: id })) }, author: ids.authors['redaksi-jari-pmi'] },
    { title: 'Hak Pekerja Migran yang Sering Diabaikan', slug: 'hak-pekerja-migran-yang-sering-diabaikan', excerpt: 'Ketahui hak-hak PMI yang seringkali tidak terpenuhi dan cara melindunginya.', content: '<p>Banyak hak PMI yang sering diabaikan baik oleh pemberi kerja maupun oleh PMI itu sendiri. Hak atas upah yang layak, jam kerja yang wajar, istirahat mingguan, dan perlindungan asuransi adalah sebagian dari hak-hak yang seharusnya didapatkan.</p><p>Jika hak Anda dilanggar, jangan diam. Laporkan ke KBRI/KJRI setempat atau melalui layanan pengaduan BP2MI. Mendiamkan pelanggaran hak hanya akan memperburuk situasi.</p>', article_category: ids.articleCategories['perlindungan'], article_tags: { connect: [ids.articleTags['hukum'], ids.articleTags['hak-pekerja']].map(id => ({ documentId: id })) }, author: ids.authors['admin-jari-pmi'] },
    { title: 'Panduan Bahasa untuk PMI di Asia Timur', slug: 'panduan-bahasa-untuk-pmi-di-asia-timur', excerpt: 'Tips belajar bahasa Mandarin, Korea, dan Jepang untuk PMI.', content: '<p>Kemampuan berbahasa negara tujuan sangat penting untuk kelangsungan kerja dan keselamatan PMI. Berikut panduan singkat untuk belajar bahasa Mandarin, Korea, dan Jepang.</p><p>Untuk bahasa Mandarin, fokuslah pada percakapan sehari-hari di tempat kerja. Untuk bahasa Korea, pelajari ungkapan dasar untuk komunikasi dengan atasan dan rekan kerja. Untuk bahasa Jepang, pahami tingkatan bahasa (keigo) yang digunakan dalam konteks formal.</p><p>BP2MI menyediakan program pelatihan bahasa gratis yang dapat diakses secara online melalui P2MI Online.</p>', article_category: ids.articleCategories['tips-dan-panduan'], article_tags: { connect: [ids.articleTags['pelatihan'], ids.articleTags['dokumentasi']].map(id => ({ documentId: id })) }, author: ids.authors['redaksi-jari-pmi'] },
  ]

  const resultIds = {}
  for (const article of articles) {
    const doc = await strapi.documents(uid).create({ data: { ...article } })
    await strapi.documents(uid).publish(doc.documentId)
    resultIds[article.slug] = doc.documentId
  }
  console.log(`  Created ${articles.length} articles (published)`)
  return resultIds
}

async function seedCourses(strapi, ids) {
  console.log('Seeding courses...')
  const uid = 'api::course.course'

  const courses = [
    { name: 'Pelatihan Keselamatan Kerja di Luar Negeri', slug: 'pelatihan-keselamatan-kerja-di-luar-negeri', excerpt: 'Pelatihan wajib tentang standar keselamatan dan kesehatan kerja untuk PMI.', description: '<p>Pelatihan ini mencakup standar keselamatan kerja internasional, penggunaan alat pelindung diri, prosedur darurat, dan hak-hak K3 PMI di negara penempatan.</p><p>Materi pelatihan meliputi identifikasi bahaya di tempat kerja, prosedur pelaporan kecelakaan, pertolongan pertama, dan evakuasi darurat.</p>', price: 0, link: 'https://bp2mi.go.id/pelatihan/keselamatan-kerja', instructor: 'Tim BP2MI', course_duration: '2 hari', final_price: 0, course_category: ids.courseCategories['keselamatan-dan-k3'], learning_method: ids.courseLearningMethods['offline'], course_tags: { connect: [ids.courseTags['gratis'], ids.courseTags['bersertifikat']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['bp2mi'], is_featured: true },
    { name: 'Bahasa Mandarin Dasar untuk PMI', slug: 'bahasa-mandarin-dasar-untuk-pmi', excerpt: 'Kursus bahasa Mandarin dasar untuk PMI yang akan bekerja di Taiwan dan China.', description: '<p>Pelatihan bahasa Mandarin dasar ini dirancang khusus untuk PMI yang akan bekerja di negara berbahasa Mandarin. Materi mencakup percakapan sehari-hari, kosakata tempat kerja, dan ungkapan darurat.</p>', price: 0, link: 'https://p2mionline.kemnaker.go.id/kursus/mandarin-dasar', instructor: 'Pengajar Bahasa Mandarin', course_duration: '4 minggu', final_price: 0, course_category: ids.courseCategories['bahasa'], learning_method: ids.courseLearningMethods['self-paced'], course_tags: { connect: [ids.courseTags['online'], ids.courseTags['mandiri']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['p2mi-online'], is_featured: true },
    { name: 'Bahasa Arab untuk Pekerja Migran', slug: 'bahasa-arab-untuk-pekerja-migran', excerpt: 'Kursus bahasa Arab dasar untuk PMI yang akan bekerja di Timur Tengah.', description: '<p>Pelatihan bahasa Arab dasar untuk PMI yang akan ditempatkan di negara-negara Timur Tengah. Materi mencakup percakapan di tempat kerja, istilah teknis, dan komunikasi darurat.</p>', price: 0, link: 'https://p2mionline.kemnaker.go.id/kursus/arab-dasar', instructor: 'Pengajar Bahasa Arab', course_duration: '4 minggu', final_price: 0, course_category: ids.courseCategories['bahasa'], learning_method: ids.courseLearningMethods['self-paced'], course_tags: { connect: [ids.courseTags['online'], ids.courseTags['mandiri']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['p2mi-online'], is_featured: true },
    { name: 'Keterampilan Teknik Bangunan', slug: 'keterampilan-teknik-bangunan', excerpt: 'Pelatihan keterampilan konstruksi dan teknik bangunan untuk PMI.', description: '<p>Pelatihan keterampilan teknik bangunan mencakup dasar-dasar konstruksi, pengelasan, plumbing, dan pengecatan. Pelatihan ini bersertifikat dan diakui oleh lembaga penempatan.</p>', price: 500000, link: 'https://bp2mi.go.id/pelatihan/teknik-bangunan', instructor: 'Instruktur Teknik', course_duration: '2 minggu', final_price: 450000, course_category: ids.courseCategories['keterampilan'], learning_method: ids.courseLearningMethods['offline'], course_tags: { connect: [ids.courseTags['offline'], ids.courseTags['bersertifikat']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['lembaga-pelatihan-terakreditasi'], is_featured: false },
    { name: 'Manajemen Keuangan untuk PMI', slug: 'manajemen-keuangan-untuk-pmi', excerpt: 'Pelatihan pengelolaan keuangan dan perencanaan masa depan untuk PMI.', description: '<p>Pelatihan manajemen keuangan ini membantu PMI mengelola penghasilan dengan bijak, termasuk cara menabung, mengirim uang ke tanah air, investasi, dan perencanaan keuangan jangka panjang.</p>', price: 0, link: 'https://bp2mi.go.id/pelatihan/manajemen-keuangan', instructor: 'Konsultan Keuangan', course_duration: '1 bulan', final_price: 0, course_category: ids.courseCategories['manajemen-keuangan'], learning_method: ids.courseLearningMethods['webinar'], course_tags: { connect: [ids.courseTags['gratis'], ids.courseTags['online']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['bp2mi'], is_featured: true },
    { name: 'Pelatihan K3 Konstruksi', slug: 'pelatihan-k3-konstruksi', excerpt: 'Sertifikasi K3 konstruksi untuk PMI di sektor bangunan.', description: '<p>Pelatihan K3 konstruksi memberikan sertifikasi keselamatan dan kesehatan kerja khusus untuk sektor konstruksi. Materi mencakup keselamatan di ketinggian, pengelasan aman, dan penanganan material berat.</p>', price: 750000, link: 'https://bp2mi.go.id/pelatihan/k3-konstruksi', instructor: 'Ahli K3', course_duration: '3 hari', final_price: 650000, course_category: ids.courseCategories['keselamatan-dan-k3'], learning_method: ids.courseLearningMethods['offline'], course_tags: { connect: [ids.courseTags['offline'], ids.courseTags['bersertifikat']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['lembaga-pelatihan-terakreditasi'], is_featured: false },
  ]

  const resultIds = {}
  for (const course of courses) {
    const { course_category, learning_method, course_tags, learning_platform, is_featured, ...data } = course
    const doc = await strapi.documents(uid).create({
      data: {
        ...data, price: course.price, final_price: course.final_price,
        course_category: course_category ? { connect: [{ documentId: course_category }] } : undefined,
        learning_method: learning_method ? { connect: [{ documentId: learning_method }] } : undefined,
        course_tags, learning_platform: learning_platform ? { connect: [{ documentId: learning_platform }] } : undefined,
        is_featured,
      },
    })
    await strapi.documents(uid).publish(doc.documentId)
    resultIds[course.slug] = doc.documentId
  }
  console.log(`  Created ${courses.length} courses (published)`)
  return resultIds
}

async function seedCurriculums(strapi, ids) {
  console.log('Seeding curriculums...')
  const uid = 'api::curriculum.curriculum'

  const curriculums = [
    { course: ids.courses['pelatihan-keselamatan-kerja-di-luar-negeri'], title: 'Identifikasi Bahaya', content: '<p>Memahami jenis-jenis bahaya di tempat kerja, cara mengidentifikasi potensi bahaya, dan langkah-langkah pencegahannya.</p>', duration: 15, order: 1 },
    { course: ids.courses['pelatihan-keselamatan-kerja-di-luar-negeri'], title: 'Prosedur Darurat', content: '<p>Prosedur penanganan situasi darurat, jalur evakuasi, dan pertolongan pertama pada kecelakaan kerja.</p>', duration: 20, order: 2 },
    { course: ids.courses['bahasa-mandarin-dasar-untuk-pmi'], title: 'Percakapan Sehari-hari', content: '<p>Ungkapan dasar bahasa Mandarin untuk komunikasi sehari-hari, termasuk salam, perkenalan, dan percakapan di lingkungan kerja.</p>', duration: 30, order: 1 },
    { course: ids.courses['bahasa-mandarin-dasar-untuk-pmi'], title: 'Kosakata Tempat Kerja', content: '<p>Kosakata khusus untuk lingkungan kerja, termasuk istilah teknis, instruksi, dan komunikasi dengan atasan.</p>', duration: 25, order: 2 },
    { course: ids.courses['manajemen-keuangan-untuk-pmi'], title: 'Menabung & Investasi', content: '<p>Strategi menabung yang efektif, jenis-jenis investasi untuk PMI, dan cara memulai investasi dengan modal kecil.</p>', duration: 20, order: 1 },
    { course: ids.courses['manajemen-keuangan-untuk-pmi'], title: 'Perencanaan Pensiun', content: '<p>Pentingnya perencanaan pensiun sejak dini, cara menghitung dana pensiun yang dibutuhkan, dan instrumen keuangan untuk pensiun.</p>', duration: 15, order: 2 },
  ]

  const resultIds = {}
  for (const item of curriculums) {
    const { course, ...data } = item
    const doc = await strapi.documents(uid).create({
      data: { ...data, course: { connect: [{ documentId: course }] } },
    })
    resultIds[`${item.course}-${item.order}`] = doc.documentId
  }
  console.log(`  Created ${curriculums.length} curriculums`)
  return resultIds
}

async function seedPages(strapi) {
  console.log('Seeding pages...')
  const uid = 'api::page.page'
  const items = [
    { name: 'Home', slug: 'home' },
    { name: 'Calon PMI', slug: 'calon-pmi' },
    { name: 'PMI Aktif', slug: 'pmi-aktif' },
    { name: 'Keluarga PMI', slug: 'keluarga-pmi' },
    { name: 'Purna PMI', slug: 'purna-pmi' },
    { name: 'Negara Tujuan', slug: 'negara-tujuan' },
    { name: 'Pelatihan', slug: 'pelatihan' },
    { name: 'Artikel', slug: 'artikel' },
    { name: 'Informasi Keuangan', slug: 'informasi-keuangan' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} pages`)
  return ids
}

async function seedAlerts(strapi, ids) {
  console.log('Seeding alerts...')
  const uid = 'api::alert.alert'

  const alerts = [
    { type: 'warning', title: 'Pendaftaran PMI Tahap II', message: '<p>Pendaftaran PMI tahap II dibuka hingga 30 Juni 2026</p>', link: 'https://bp2mi.go.id', pages: [ids.pages['home'], ids.pages['calon-pmi']], active: true, start_date: '2026-05-01T00:00:00.000Z', end_date: '2026-06-30T23:59:59.000Z' },
    { type: 'info', title: 'Verifikasi Dokumen', message: '<p>Segera verifikasi dokumen Anda sebelum keberangkatan</p>', link: '', pages: [ids.pages['calon-pmi']], active: true, start_date: '2026-05-01T00:00:00.000Z', end_date: '2026-12-31T23:59:59.000Z' },
  ]

  for (const alert of alerts) {
    const { pages, ...data } = alert
    const doc = await strapi.documents(uid).create({
      data: { ...data, pages: { connect: pages.map(id => ({ documentId: id })) } },
    })
    await strapi.documents(uid).publish(doc.documentId)
  }
  console.log(`  Created ${alerts.length} alerts (published)`)
}

async function seedAnnouncements(strapi, ids) {
  console.log('Seeding announcements...')
  const uid = 'api::announcement.announcement'

  const items = [
    { name: 'Pendaftaran PMI Gelombang 2', slug: 'pendaftaran-pmi-gelombang-2', excerpt: 'Daftar sekarang untuk penempatan luar negeri', description: '<p>Pendaftaran PMI gelombang kedua telah dibuka. Segera daftarkan diri Anda melalui layanan BLTK Online atau kunjungi kantor BP2MI terdekat.</p>', link: 'https://bp2mi.go.id/pendaftaran', start_date: '2026-05-01T00:00:00.000Z', end_date: '2026-06-30T23:59:59.000Z', personas: [ids.personas['calon-pmi']], order: 1 },
    { name: 'Webinar Manajemen Keuangan', slug: 'webinar-manajemen-keuangan', excerpt: 'Ikuti webinar gratis tentang pengelolaan keuangan', description: '<p>Webinar gratis untuk PMI dan keluarga tentang cara mengelola keuangan dengan bijak, termasuk tips menabung, investasi, dan perencanaan masa depan.</p>', link: 'https://bp2mi.go.id/webinar/keuangan', start_date: '2026-05-01T00:00:00.000Z', end_date: '2026-05-30T23:59:59.000Z', personas: [ids.personas['pmi-aktif'], ids.personas['purna-pmi']], order: 2 },
    { name: 'Panduan Vaksinasi PMI', slug: 'panduan-vaksinasi-pmi', excerpt: 'Informasi lengkap vaksinasi untuk PMI', description: '<p>Ketahui jenis vaksin yang diperlukan sebelum berangkat ke luar negeri, lokasi vaksinasi terdekat, dan prosedur mendapatkan sertifikat vaksin internasional.</p>', link: 'https://bp2mi.go.id/vaksinasi', start_date: '2026-05-01T00:00:00.000Z', end_date: '2026-12-31T23:59:59.000Z', personas: [ids.personas['calon-pmi'], ids.personas['pmi-aktif']], order: 3 },
  ]

  const resultIds = {}
  for (const item of items) {
    const { personas, ...data } = item
    const doc = await strapi.documents(uid).create({
      data: { ...data, personas: { connect: personas.map(id => ({ documentId: id })) } },
    })
    resultIds[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} announcements`)
  return resultIds
}

async function seedContentGroups(strapi, ids) {
  console.log('Seeding content groups...')
  const cgUid = 'api::content-group.content-group'

  const groups = [
    { title: 'Persiapan Sebelum Berangkat', slug: 'persiapan-sebelum-berangkat', description: '<p>Panduan lengkap untuk mempersiapkan diri sebelum bekerja ke luar negeri.</p>', personas: [ids.personas['calon-pmi']], order: 1, meta_seo: { meta_title: 'Persiapan Sebelum Berangkat - JARI PMI', meta_description: 'Panduan lengkap persiapan PMI sebelum berangkat ke luar negeri' } },
    { title: 'Hak dan Perlindungan PMI Aktif', slug: 'hak-dan-perlindungan-pmi-aktif', description: '<p>Informasi tentang hak dan perlindungan bagi PMI yang sedang bekerja di luar negeri.</p>', personas: [ids.personas['pmi-aktif']], order: 2, meta_seo: { meta_title: 'Hak dan Perlindungan PMI Aktif - JARI PMI', meta_description: 'Informasi hak dan perlindungan PMI yang sedang bekerja di luar negeri' } },
    { title: 'Panduan untuk Keluarga PMI', slug: 'panduan-untuk-keluarga-pmi', description: '<p>Informasi dan panduan untuk keluarga Pekerja Migran Indonesia.</p>', personas: [ids.personas['keluarga-pmi']], order: 3, meta_seo: { meta_title: 'Panduan untuk Keluarga PMI - JARI PMI', meta_description: 'Informasi dan panduan bagi keluarga Pekerja Migran Indonesia' } },
    { title: 'Memulai Kehidupan Baru', slug: 'memulai-kehidupan-baru', description: '<p>Panduan bagi PMI yang telah selesai bekerja di luar negeri untuk memulai kehidupan baru.</p>', personas: [ids.personas['purna-pmi']], order: 4, meta_seo: { meta_title: 'Memulai Kehidupan Baru - JARI PMI', meta_description: 'Panduan bagi Purna PMI untuk memulai kehidupan baru di Indonesia' } },
  ]

  const groupIds = {}
  for (const group of groups) {
    const { personas, meta_seo, ...groupData } = group
    const cgDoc = await strapi.documents(cgUid).create({
      data: { ...groupData, personas: personas?.length ? { connect: personas.map(id => ({ documentId: id })) } : undefined, meta_seo },
    })
    await strapi.documents(cgUid).publish(cgDoc.documentId)
    groupIds[group.slug] = cgDoc.documentId
  }

  console.log(`  Created ${groups.length} content groups (published)`)
  return groupIds
}

async function seedContents(strapi, ids) {
  console.log('Seeding contents...')
  const cUid = 'api::content.content'

  const contentsByGroup = {
    'persiapan-sebelum-berangkat': [
      { title: 'Dokumen yang Wajib Disiapkan', slug: 'dokumen-yang-wajib-disiapkan', excerpt: 'Daftar lengkap dokumen yang perlu disiapkan sebelum berangkat ke luar negeri.', body: '<p>Sebelum berangkat bekerja ke luar negeri, pastikan Anda sudah menyiapkan seluruh dokumen yang diperlukan. Kelengkapan dokumen adalah kunci utama untuk perlindungan dan kelancaran proses penempatan.</p><p>Dokumen wajib meliputi: paspor dengan masa berlaku minimal 2 tahun, visa kerja resmi, kontrak kerja yang telah ditandatangani, sertifikat kesehatan dari puskesmas/rumah sakit terakreditasi, sertifikat pelatihan dari BP2MI, dan surat izin penempatan.</p>', order: 1 },
      { title: 'Tips Mengurus Izin Penempatan', slug: 'tips-mengurus-izin-penempatan', excerpt: 'Langkah-langkah mengurus izin penempatan PMI yang sah dan terpercaya.', body: '<p>Izin penempatan adalah dokumen resmi yang dikeluarkan oleh BP2MI sebagai bukti bahwa proses penempatan PMI telah sesuai dengan ketentuan yang berlaku. Mengurus izin penempatan melalui jalur resmi sangat penting untuk perlindungan Anda.</p><p>Proses pengurusan izin penempatan meliputi pendaftaran online melalui SISKOP2MI, verifikasi dokumen, pelaksanaan pelatihan, dan penerbitan izin oleh BP2MI. Hindari calo atau pihak yang menawarkan jasa penempatan ilegal.</p>', order: 2 },
    ],
    'hak-dan-perlindungan-pmi-aktif': [
      { title: 'Hak Upah dan Tunjangan PMI', slug: 'hak-upah-dan-tunjangan-pmi', excerpt: 'Ketahui hak Anda atas upah dan tunjangan selama bekerja di luar negeri.', body: '<p>Setiap PMI berhak mendapatkan upah sesuai dengan yang tercantum dalam kontrak kerja. Upah harus dibayar tepat waktu dan tidak boleh dipotong tanpa alasan yang sah.</p><p>Selain upah dasar, PMI juga berhak atas tunjangan perumahan, tunjangan transportasi, dan tunjangan makan sesuai ketentuan kontrak kerja. Pastikan Anda memahami seluruh komponen remunerasi sebelum menandatangani kontrak.</p>', order: 1 },
      { title: 'Prosedur Pengaduan di Luar Negeri', slug: 'prosedur-pengaduan-di-luar-negeri', excerpt: 'Langkah-langkah yang harus diambil jika mengalami masalah di negara penempatan.', body: '<p>Jika Anda mengalami masalah di negara penempatan, langkah pertama adalah menghubungi KBRI atau KJRI setempat. Mereka akan membantu menyelesaikan masalah Anda sesuai dengan hukum yang berlaku.</p><p>Anda juga dapat mengajukan pengaduan melalui layanan online BP2MI atau menghubungi tim perlindungan PMI. Dokumentasikan semua bukti terkait masalah yang Anda alami.</p>', order: 2 },
    ],
    'panduan-untuk-keluarga-pmi': [
      { title: 'Cara Berkomunikasi dengan PMI di Luar Negeri', slug: 'cara-berkomunikasi-dengan-pmi-di-luar-negeri', excerpt: 'Tips menjaga komunikasi dengan keluarga yang bekerja di luar negeri.', body: '<p>Komunikasi yang rutin dengan keluarga di luar negeri sangat penting untuk menjaga kesehatan mental dan hubungan keluarga. Manfaatkan teknologi komunikasi seperti video call, pesan teks, dan media sosial.</p><p>Atur jadwal komunikasi yang konsisten dan pastikan untuk selalu menanyakan kondisi kerja dan kesehatan. Jika ada tanda-tanda masalah, segera laporkan ke pihak berwenang.</p>', order: 1 },
      { title: 'Mengelola Keuangan Keluarga PMI', slug: 'mengelola-keuangan-keluarga-pmi', excerpt: 'Panduan pengelolaan keuangan bagi keluarga yang menerima remitansi.', body: '<p>Mengelola remitansi dengan bijak adalah kunci untuk memaksimalkan manfaat dari kerja di luar negeri. Buat rencana keuangan keluarga yang mencakup kebutuhan sehari-hari, tabungan, investasi, dan dana darurat.</p><p>Gunakan layanan transfer uang resmi yang terdaftar di Bank Indonesia. Hindari pengiriman uang melalui jalur informal yang berisiko dan tidak terlindungi hukum.</p>', order: 2 },
    ],
    'memulai-kehidupan-baru': [
      { title: 'Program Reintegrasi untuk Purna PMI', slug: 'program-reintegrasi-untuk-purna-pmi', excerpt: 'Informasi tentang program reintegrasi dan dukungan bagi Purna PMI.', body: '<p>Program reintegrasi dirancang untuk membantu Purna PMI kembali beradaptasi dan berkontribusi di Indonesia. Program ini mencakup pelatihan kewirausahaan, bantuan modal usaha, dan konseling karier.</p><p>Manfaatkan program-program reintegrasi yang disediakan oleh pemerintah melalui BP2MI dan Kementerian Ketenagakerjaan. Program ini bertujuan memastikan pengalaman bekerja di luar negeri dapat bermanfaat bagi masa depan Anda di Indonesia.</p>', order: 1 },
      { title: 'Tips Berwirausaha Setelah Pulang', slug: 'tips-berwirausaha-setelah-pulang', excerpt: 'Panduan memulai usaha sendiri setelah selesai bekerja di luar negeri.', body: '<p>Bekerja di luar negeri memberikan pengalaman dan modal yang berharga untuk memulai usaha sendiri di Indonesia. Identifikasi keterampilan dan pengetahuan yang Anda peroleh selama bekerja dan bagaimana hal itu dapat diterapkan dalam konteks lokal.</p><p>Langkah-langkah memulai usaha: riset pasar, buat rencana bisnis, daftar program bantuan modal pemerintah, dan jaringan dengan sesama Purna PMI yang sudah berhasil berwirausaha.</p>', order: 2 },
    ],
  }

  let count = 0
  for (const [groupSlug, contents] of Object.entries(contentsByGroup)) {
    const groupId = ids.contentGroups[groupSlug]
    for (const content of contents) {
      await strapi.documents(cUid).create({
        data: { title: content.title, slug: content.slug, excerpt: content.excerpt, body: content.body, order: content.order, content_group: { connect: [{ documentId: groupId }] }, meta_seo: { meta_title: content.title, meta_description: content.excerpt } },
      })
      count++
    }
  }

  const allContents = await strapi.documents(cUid).findMany({ status: 'draft' })
  for (const c of allContents) {
    await strapi.documents(cUid).publish(c.documentId)
  }

  console.log(`  Created ${count} contents (published)`)
}

async function seedTools(strapi, ids) {
  console.log('Seeding tools (no seed data yet)...')
  return {}
}

async function seedFaqs(strapi) {
  console.log('Seeding faqs...')
  const uid = 'api::faq.faq'
  const items = [
    { title: 'Apa itu JARI PMI?', content: '<p>JARI PMI adalah portal informasi dan layanan terpadu untuk Pekerja Migran Indonesia (PMI). Portal ini menyediakan informasi lengkap tentang perlindungan, pelatihan, dan layanan yang dibutuhkan oleh PMI dan keluarganya.</p>', order: 1 },
    { title: 'Siapa saja yang bisa menggunakan JARI PMI?', content: '<p>JARI PMI dapat digunakan oleh Calon PMI (yang akan bekerja di luar negeri), PMI Aktif (yang sedang bekerja di luar negeri), Keluarga PMI, dan Purna PMI (yang telah selesai bekerja di luar negeri).</p>', order: 2 },
    { title: 'Bagaimana cara mendaftar sebagai PMI?', content: '<p>Untuk mendaftar sebagai PMI, Anda harus melalui jalur resmi yang disediakan oleh pemerintah. Langkah-langkahnya meliputi: pendaftaran online melalui SISKOP2MI, mengikuti pelatihan dan sertifikasi, melengkapi dokumen persyaratan, dan mendapatkan izin penempatan dari BP2MI.</p>', order: 3 },
    { title: 'Dokumen apa saja yang diperlukan untuk menjadi PMI?', content: '<p>Dokumen yang diperlukan meliputi: KTP, Kartu Keluarga, paspor, visa kerja, kontrak kerja, sertifikat kesehatan, sertifikat pelatihan, dan surat izin penempatan dari BP2MI. Pastikan semua dokumen lengkap dan sah sebelum berangkat.</p>', order: 4 },
    { title: 'Apa yang harus dilakukan jika mengalami masalah di luar negeri?', content: '<p>Jika Anda mengalami masalah di negara penempatan, segera hubungi KBRI atau KJRI setempat. Anda juga dapat mengajukan pengaduan melalui layanan online BP2MI atau menghubungi hotline perlindungan PMI di +62 812 3456 7890.</p>', order: 5 },
    { title: 'Apakah layanan di JARI PMI gratis?', content: '<p>Ya, seluruh informasi dan layanan yang disediakan di portal JARI PMI dapat diakses secara gratis. Beberapa pelatihan juga tersedia tanpa biaya melalui program pemerintah.</p>', order: 6 },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.title] = doc.documentId
  }
  console.log(`  Created ${items.length} faqs`)
  return ids
}

async function seedProvinces(strapi) {  console.log('Seeding provinces...')
  const uid = 'api::province.province'
  const items = [
    { name: 'Banten', slug: 'banten', order: 1, meta_seo: { meta_title: 'Purna PMI Banten - JARI PMI', meta_description: 'Profil Purna PMI asal Banten' } },
    { name: 'Lampung', slug: 'lampung', order: 2, meta_seo: { meta_title: 'Purna PMI Lampung - JARI PMI', meta_description: 'Profil Purna PMI asal Lampung' } },
    { name: 'Jawa Barat', slug: 'jawa-barat', order: 3, meta_seo: { meta_title: 'Purna PMI Jawa Barat - JARI PMI', meta_description: 'Profil Purna PMI asal Jawa Barat' } },
    { name: 'Yogyakarta', slug: 'yogyakarta', order: 4, meta_seo: { meta_title: 'Purna PMI Yogyakarta - JARI PMI', meta_description: 'Profil Purna PMI asal Yogyakarta' } },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} provinces`)
  return ids
}

async function seedPurnaPmis(strapi, ids) {
  console.log('Seeding purna pmis...')
  const uid = 'api::purna-pmi.purna-pmi'

  const items = [
    {
      name: 'Bapak Turidjo Hadi & Ibu Sri Titin',
      slug: 'bapak-turidjo-hadi-dan-ibu-sri-titin',
      brand: 'Saripati Laer',
      business_type: 'Kuliner (Minuman Herbal)',
      products: 'Minuman Instan Berbahan Herbal',
      revenue: 'Rp 50 Juta / bulan',
      employee_count: '20 Orang',
      production_capacity: '3.000 kg / bulan',
      year_established: 2006,
      legal_entity: 'CV. Saripati Laer',
      city: 'Cilegon',
      marketing_channels: ['Retail', 'Online', 'Ekspor'],
      contact: '081960615933',
      province: ids.provinces['banten'],
      is_featured: true,
      order: 1,
      meta_seo: { meta_title: 'Bapak Turidjo Hadi & Ibu Sri Titin - Purna PMI JARI PMI', meta_description: 'Kisah sukses Purna PMI asal Banten dengan usaha Saripati Laer' },
    },
    {
      name: 'Bapak Ahmad Suhendra',
      slug: 'bapak-ahmad-suhendra',
      brand: 'Suhendra Furniture',
      business_type: 'Furniture (Mebel)',
      products: 'Meubel Kayu Jati dan Mahoni',
      revenue: 'Rp 80 Juta / bulan',
      employee_count: '15 Orang',
      production_capacity: '50 unit / bulan',
      year_established: 2012,
      legal_entity: 'UD. Suhendra Furniture',
      city: 'Bandar Lampung',
      marketing_channels: ['Retail', 'Online'],
      contact: '081234567890',
      province: ids.provinces['lampung'],
      is_featured: true,
      order: 2,
      meta_seo: { meta_title: 'Bapak Ahmad Suhendra - Purna PMI JARI PMI', meta_description: 'Kisah sukses Purna PMI asal Lampung dengan usaha mebel' },
    },
  ]

  const resultIds = {}
  for (const item of items) {
    const { province, ...data } = item
    const doc = await strapi.documents(uid).create({
      data: { ...data, province: { connect: [{ documentId: province }] } },
    })
    await strapi.documents(uid).publish(doc.documentId)
    resultIds[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} purna pmis (published)`)
  return resultIds
}

async function seedGlobal(strapi) {
  console.log('Seeding global (singleType)...')
  const uid = 'api::global.global'

  await strapi.documents(uid).create({
    data: {
      site_name: 'JARI PMI',
      site_description: 'Portal informasi dan layanan untuk Pekerja Migran Indonesia',
      nav_links: [
        { label: 'Beranda', url: '/', is_external: false },
        { label: 'Informasi', url: '/informasi', is_external: false },
        { label: 'Pelatihan', url: '/pelatihan', is_external: false },
        { label: 'Artikel', url: '/artikel', is_external: false },
      ],
      external_links: [
        { label: 'SISKOP2MI', url: 'https://siskop2mi.kemnaker.go.id', is_external: true },
        { label: 'Pengaduan PMI', url: 'https://pengaduan.bp2mi.go.id', is_external: true },
      ],
      footer_columns: [
        { heading: 'Informasi', links: [{ label: 'Profil PMI', url: '/informasi', is_external: false }, { label: 'Negara Tujuan', url: '/informasi/negara-tujuan', is_external: false }, { label: 'Pelatihan', url: '/pelatihan', is_external: false }] },
        { heading: 'Layanan', links: [{ label: 'Pengaduan', url: 'https://pengaduan.bp2mi.go.id', is_external: true }, { label: 'SISKOP2MI', url: 'https://siskop2mi.kemnaker.go.id', is_external: true }, { label: 'BPJS Ketenagakerjaan', url: '/informasi/bpjs-ketenagakerjaan', is_external: false }] },
      ],
      social_links: [
        { platform: 'facebook', url: 'https://facebook.com/bp2mi' },
        { platform: 'instagram', url: 'https://instagram.com/bp2mi' },
        { platform: 'youtube', url: 'https://youtube.com/@bp2mi' },
      ],
      copyright_text: '© 2026 JARI PMI. Hak cipta dilindungi undang-undang.',
      default_seo: { meta_title: 'JARI PMI - Portal Informasi Pekerja Migran Indonesia', meta_description: 'Portal informasi dan layanan terpadu untuk Pekerja Migran Indonesia (PMI). Dapatkan informasi perlindungan, pelatihan, dan layanan terkini.', meta_keywords: 'PMI, pekerja migran Indonesia, JARI PMI, perlindungan PMI, pelatihan PMI' },
    },
  })

  console.log('  Created global (singleType)')
}