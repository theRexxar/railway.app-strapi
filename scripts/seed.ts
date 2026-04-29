// @ts-nocheck - Seeding module called from bootstrap lifecycle

export async function seed(strapi) {
  await cleanDatabase(strapi);
  console.log('');

  const ids = {};

  ids.articleCategories = await seedArticleCategories(strapi)
  ids.articleTags = await seedArticleTags(strapi)
  ids.courseCategories = await seedCourseCategories(strapi)
  ids.courseTags = await seedCourseTags(strapi)
  ids.learningPlatforms = await seedLearningPlatforms(strapi)
  ids.authors = await seedAuthors(strapi)
  ids.personas = await seedPersonas(strapi)
  ids.countries = await seedCountries(strapi)
  ids.protectionInfos = await seedProtectionInfos(strapi)

  console.log('')
  ids.serviceInfos = await seedServiceInfos(strapi, ids)
  ids.articles = await seedArticles(strapi, ids)
  ids.courses = await seedCourses(strapi, ids)
  await seedAlerts(strapi)

  console.log('')
  ids.contentGroups = await seedContentGroupsAndContents(strapi, ids)

  console.log('')
  await seedGlobal(strapi)
}

async function cleanDatabase(strapi) {
  console.log('Cleaning database (preserving admin user)...')

  const client = strapi.config.get('database.connection.client')

  const tables = [
    'articles_article_category_lnk', 'articles_article_tags_lnk', 'articles_author_lnk',
    'content_groups_contents_lnk', 'content_groups_countries_lnk', 'content_groups_service_infos_lnk',
    'content_groups_protection_infos_lnk', 'content_groups_courses_lnk', 'content_groups_personas_lnk',
    'courses_course_category_lnk', 'courses_course_tags_lnk', 'courses_learning_platform_lnk', 'courses_countries_lnk',
    'homepage_featured_services_lnk', 'homepage_featured_countries_lnk', 'homepage_featured_courses_lnk', 'homepage_featured_articles_lnk',
    'service_infos_countries_lnk', 'files_related_mph', 'files_folder_lnk',
    'content_groups', 'contents', 'articles', 'courses', 'service_infos', 'protection_infos', 'alerts',
    'authors', 'countries', 'personas', 'article_categories', 'article_tags',
    'course_categories', 'course_tags', 'learning_platforms',
    'files', 'upload_folders',
    'global', 'homepage',
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
    { name: 'Berita', slug: 'berita', description: 'Berita terbaru seputar PMI' },
    { name: 'Ketenagakerjaan', slug: 'ketenagakerjaan', description: 'Informasi ketenagakerjaan' },
    { name: 'Perlindungan', slug: 'perlindungan', description: 'Informasi perlindungan PMI' },
    { name: 'Tips & Panduan', slug: 'tips-dan-panduan', description: 'Tips dan panduan untuk PMI' },
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
    { name: 'Calon PMI', slug: 'calon-pmi', description: 'Berencana bekerja di luar negeri', background_color: '#1A5276', order: 1, meta_seo: { meta_title: 'Calon PMI - JARI PMI', meta_description: 'Informasi untuk calon Pekerja Migran Indonesia' } },
    { name: 'PMI Aktif', slug: 'pmi-aktif', description: 'Sedang bekerja di luar negeri', background_color: '#117864', order: 2, meta_seo: { meta_title: 'PMI Aktif - JARI PMI', meta_description: 'Informasi untuk PMI yang sedang bekerja di luar negeri' } },
    { name: 'Keluarga PMI', slug: 'keluarga-pmi', description: 'Keluarga pekerja migran Indonesia', background_color: '#7D3C98', order: 3, meta_seo: { meta_title: 'Keluarga PMI - JARI PMI', meta_description: 'Informasi untuk keluarga Pekerja Migran Indonesia' } },
    { name: 'Purna PMI', slug: 'purna-pmi', description: 'Telah selesai bekerja di luar negeri', background_color: '#B7950B', order: 4, meta_seo: { meta_title: 'Purna PMI - JARI PMI', meta_description: 'Informasi untuk PMI yang telah selesai bekerja di luar negeri' } },
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
    { name: 'Malaysia', slug: 'malaysia', region: 'asia', is_featured: true, vacancy_count: 12000, salary_avg: 'Rp 3,5 juta/bulan', pmi_count: 800000, order: 1, description: '<p>Malaysia merupakan salah satu tujuan utama PMI dengan banyak peluang di sektor konstruksi, perkebunan, dan domestik.</p>' },
    { name: 'Arab Saudi', slug: 'arab-saudi', region: 'middle-east', is_featured: true, vacancy_count: 8500, salary_avg: 'Rp 4 juta/bulan', pmi_count: 600000, order: 2, description: '<p>Arab Saudi menawarkan peluang kerja di sektor konstruksi, perawatan kesehatan, dan domestik dengan gaji yang kompetitif.</p>' },
    { name: 'Hong Kong', slug: 'hong-kong', region: 'asia', is_featured: true, vacancy_count: 5000, salary_avg: 'Rp 5 juta/bulan', pmi_count: 350000, order: 3, description: '<p>Hong Kong banyak membutuhkan pekerja domestik dan perawat dari Indonesia.</p>' },
    { name: 'Taiwan', slug: 'taiwan', region: 'asia', is_featured: true, vacancy_count: 6000, salary_avg: 'Rp 4,5 juta/bulan', pmi_count: 300000, order: 4, description: '<p>Taiwan menawarkan peluang kerja di sektor manufaktur, perikanan, dan domestik.</p>' },
    { name: 'Singapura', slug: 'singapura', region: 'asia', is_featured: true, vacancy_count: 4000, salary_avg: 'Rp 5,5 juta/bulan', pmi_count: 250000, order: 5, description: '<p>Singapura membutuhkan PMI di sektor konstruksi, domestik, dan perawatan.</p>' },
    { name: 'Korea Selatan', slug: 'korea-selatan', region: 'asia', is_featured: false, vacancy_count: 3000, salary_avg: 'Rp 6 juta/bulan', pmi_count: 50000, order: 6, description: '<p>Korea Selatan membuka peluang kerja di sektor manufaktur dan perikanan melalui program EPS.</p>' },
    { name: 'Jepang', slug: 'jepang', region: 'asia', is_featured: false, vacancy_count: 2500, salary_avg: 'Rp 5 juta/bulan', pmi_count: 40000, order: 7, description: '<p>Jepang menawarkan program kerja magang dan keterampilan teknis untuk PMI Indonesia.</p>' },
    { name: 'Uni Emirates Arab', slug: 'uni-emirates-arab', region: 'middle-east', is_featured: false, vacancy_count: 7000, salary_avg: 'Rp 4 juta/bulan', pmi_count: 200000, order: 8, description: '<p>UEA membutuhkan banyak PMI di sektor konstruksi, perhotelan, dan jasa.</p>' },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: { ...item } })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} countries`)
  return ids
}

async function seedProtectionInfos(strapi) {
  console.log('Seeding protection infos...')
  const uid = 'api::protection-info.protection-info'
  const items = [
    { title: 'Hak-Hak PMI di Luar Negeri', slug: 'hak-hak-pmi-di-luar-negeri', description: 'Ketahui hak Anda sebagai PMI di negara penempatan', content: '<p>Sebagai Pekerja Migran Indonesia, Anda memiliki hak-hak yang dilindungi oleh hukum, baik hukum Indonesia maupun hukum negara penempatan. Memahami hak-hak ini adalah langkah pertama untuk memastikan perlindungan Anda selama bekerja di luar negeri.</p><p>Hak-hak utama PMI meliputi: hak atas upah yang layak, hak atas istirahat dan cuti, hak atas perlindungan keselamatan dan kesehatan kerja, hak atas perlindungan sosial, serta hak atas perlakuan yang setara tanpa diskriminasi.</p>', category: 'hak-pmi', order: 1 },
    { title: 'Prosedur Pengaduan PMI', slug: 'prosedur-pengaduan-pmi', description: 'Langkah-langkah pengaduan jika mengalami masalah', content: '<p>Jika Anda mengalami masalah selama bekerja di luar negeri, Anda berhak mengajukan pengaduan. Prosedur pengaduan PMI dirancang untuk memastikan setiap keluhan ditangani secara cepat dan adil.</p><p>Anda dapat mengajukan pengaduan melalui KBRI/KJRI setempat, layanan pengaduan online BP2MI, atau langsung melalui aplikasi JARI PMI ini. Simpan semua bukti dan dokumentasi terkait masalah Anda.</p>', category: 'perlindungan', order: 2 },
    { title: 'Jaminan Sosial Tenaga Kerja', slug: 'jaminan-sosial-tenaga-kerja', description: 'Perlindungan jaminan sosial untuk PMI', content: '<p>PMI memiliki hak atas jaminan sosial tenaga kerja yang meliputi Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JKM), Jaminan Hari Tua (JHT), dan Jaminan Pensiun. Program ini dikelola oleh BPJS Ketenagakerjaan.</p><p>Pastikan Anda terdaftar sebagai peserta BPJS Ketenagakerjaan sebelum berangkat ke luar negeri. Jaminan sosial ini memberikan perlindungan finansial jika terjadi kecelakaan kerja, sakit, atau risiko lainnya.</p>', category: 'jaminan-sosial', order: 3 },
    { title: 'Klaim Asuransi PMI', slug: 'klaim-asuransi-pmi', description: 'Cara mengajukan klaim asuransi sebagai PMI', content: '<p>Sebagai PMI, Anda dilindungi oleh asuransi yang diatur dalam perjanjian kerja. Klaim asuransi dapat diajukan untuk kecelakaan kerja, sakit, repatriasi, dan risiko lainnya sesuai ketentuan polis.</p><p>Untuk mengajukan klaim, siapkan dokumen-dokumen yang diperlukan seperti surat keterangan dari perusahaan, bukti pembayaran premi, dan laporan kejadian. Proses klaim dapat dilakukan melalui agen asuransi atau langsung ke perusahaan asuransi penanggung.</p>', category: 'klaim', order: 4 },
    { title: 'Reasuransi dan Perlindungan Tambahan', slug: 'reasuransi-dan-perlindungan-tambahan', description: 'Perlindungan tambahan melalui reasuransi', content: '<p>Reasuransi memberikan lapisan perlindungan tambahan bagi PMI di luar asuransi dasar. Program ini memastikan bahwa risiko yang tidak tertanggung oleh asuransi utama tetap mendapatkan perlindungan.</p><p>Konsultasikan dengan BP2MI dan perusahaan penempatan Anda tentang cakupan reasuransi yang tersedia. Pastikan Anda memahami apa saja yang ditanggung dan prosedur klaimnya.</p>', category: 'reasuransi', order: 5 },
    { title: 'Tips Keselamatan di Negara Tujuan', slug: 'tips-keselamatan-di-negara-tujuan', description: 'Panduan keselamatan saat bekerja di luar negeri', content: '<p>Keselamatan adalah prioritas utama saat bekerja di luar negeri. Kenali lingkungan kerja Anda, pelajari prosedur keselamatan perusahaan, dan selalu gunakan alat pelindung diri yang disediakan.</p><p>Simpan nomor darurat KBRI/KJRI dan BP2MI di tempat yang mudah diakses. Jika merasa tidak aman, segera hubungi pihak berwenang atau KBRI/KJRI setempat.</p>', category: 'perlindungan', order: 6 },
  ]
  const ids = {}
  for (const item of items) {
    const doc = await strapi.documents(uid).create({ data: item })
    ids[item.slug] = doc.documentId
  }
  console.log(`  Created ${items.length} protection infos`)
  return ids
}

async function seedServiceInfos(strapi, ids) {
  console.log('Seeding service infos...')
  const uid = 'api::service-info.service-info'

  const items = [
    { title: 'QRIS Cross Border', slug: 'qris-cross-border', excerpt: 'Bayar dan transfer uang menggunakan QRIS di negara penempatan.', content: '<p>Layanan QRIS Cross Border memungkinkan PMI untuk melakukan pembayaran dan transfer uang menggunakan kode QR di negara penempatan. Layanan ini didukung oleh Bank Indonesia dan tersedia di beberapa negara tujuan PMI.</p><p>Dengan QRIS Cross Border, Anda dapat melakukan transaksi secara mudah dan aman tanpa perlu membawa uang tunai dalam jumlah besar. Cukup scan kode QR di tempat pembayaran yang tersedia.</p>', category: 'Keuangan', is_featured: true, countries: [ids.countries['malaysia'], ids.countries['arab-saudi'], ids.countries['hong-kong']] },
    { title: 'BPJS Ketenagakerjaan', slug: 'bpjs-ketenagakerjaan', excerpt: 'Jaminan sosial tenaga kerja untuk perlindungan PMI selama bekerja di luar negeri.', content: '<p>BPJS Ketenagakerjaan memberikan jaminan sosial bagi PMI yang meliputi Jaminan Kecelakaan Kerja (JKK), Jaminan Kematian (JKM), Jaminan Hari Tua (JHT), dan Jaminan Pensiun.</p><p>Pastikan Anda terdaftar sebagai peserta BPJS Ketenagakerjaan sebelum berangkat ke luar negeri. Iuran dapat dibayarkan secara berkala selama Anda bekerja di luar negeri.</p>', category: 'Ketenagakerjaan', is_featured: true, countries: [ids.countries['malaysia'], ids.countries['singapura']] },
    { title: 'BLTK Online', slug: 'bltk-online', excerpt: 'Buat dan kelola Berkas Penempatan Tenaga Kerja Indonesia secara online.', content: '<p>BLTK Online adalah layanan pembuatan Berkas Penempatan Tenaga Kerja Indonesia secara digital. Melalui layanan ini, Anda dapat mengurus persyaratan penempatan tanpa perlu datang langsung ke kantor BP2MI.</p><p>Layanan ini memudahkan proses administrasi penempatan PMI dengan sistem yang terintegrasi dan transparan.</p>', category: 'Dokumentasi', is_featured: true, countries: [ids.countries['taiwan'], ids.countries['hong-kong']] },
    { title: 'Verifikasi Dokumen PMI', slug: 'verifikasi-dokumen-pmi', excerpt: 'Verifikasi keabsahan dokumen penempatan PMI sebelum keberangkatan.', content: '<p>Layanan Verifikasi Dokumen PMI membantu Anda memastikan keabsahan seluruh dokumen penempatan sebelum berangkat ke luar negeri. Dokumen yang perlu diverifikasi antara lain kontrak kerja, visa kerja, dan izin penempatan.</p><p>Pastikan semua dokumen Anda telah diverifikasi untuk menghindari masalah di negara penempatan.</p>', category: 'Dokumentasi', is_featured: false, countries: [] },
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
    { name: 'Pelatihan Keselamatan Kerja di Luar Negeri', slug: 'pelatihan-keselamatan-kerja-di-luar-negeri', excerpt: 'Pelatihan wajib tentang standar keselamatan dan kesehatan kerja untuk PMI.', description: '<p>Pelatihan ini mencakup standar keselamatan kerja internasional, penggunaan alat pelindung diri, prosedur darurat, dan hak-hak K3 PMI di negara penempatan.</p><p>Materi pelatihan meliputi identifikasi bahaya di tempat kerja, prosedur pelaporan kecelakaan, pertolongan pertama, dan evakuasi darurat.</p>', price: 0, link: 'https://bp2mi.go.id/pelatihan/keselamatan-kerja', course_category: ids.courseCategories['keselamatan-dan-k3'], course_tags: { connect: [ids.courseTags['gratis'], ids.courseTags['bersertifikat']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['bp2mi'], target_personas: ['calon-pmi', 'pmi-aktif'], is_featured: true, countries: [ids.countries['malaysia'], ids.countries['arab-saudi']] },
    { name: 'Bahasa Mandarin Dasar untuk PMI', slug: 'bahasa-mandarin-dasar-untuk-pmi', excerpt: 'Kursus bahasa Mandarin dasar untuk PMI yang akan bekerja di Taiwan dan China.', description: '<p>Pelatihan bahasa Mandarin dasar ini dirancang khusus untuk PMI yang akan bekerja di negara berbahasa Mandarin. Materi mencakup percakapan sehari-hari, kosakata tempat kerja, dan ungkapan darurat.</p>', price: 0, link: 'https://p2mionline.kemnaker.go.id/kursus/mandarin-dasar', course_category: ids.courseCategories['bahasa'], course_tags: { connect: [ids.courseTags['online'], ids.courseTags['mandiri']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['p2mi-online'], target_personas: ['calon-pmi'], is_featured: true, countries: [ids.countries['taiwan']] },
    { name: 'Bahasa Arab untuk Pekerja Migran', slug: 'bahasa-arab-untuk-pekerja-migran', excerpt: 'Kursus bahasa Arab dasar untuk PMI yang akan bekerja di Timur Tengah.', description: '<p>Pelatihan bahasa Arab dasar untuk PMI yang akan ditempatkan di negara-negara Timur Tengah. Materi mencakup percakapan di tempat kerja, istilah teknis, dan komunikasi darurat.</p>', price: 0, link: 'https://p2mionline.kemnaker.go.id/kursus/arab-dasar', course_category: ids.courseCategories['bahasa'], course_tags: { connect: [ids.courseTags['online'], ids.courseTags['mandiri']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['p2mi-online'], target_personas: ['calon-pmi'], is_featured: true, countries: [ids.countries['arab-saudi'], ids.countries['uni-emirates-arab']] },
    { name: 'Keterampilan Teknik Bangunan', slug: 'keterampilan-teknik-bangunan', excerpt: 'Pelatihan keterampilan konstruksi dan teknik bangunan untuk PMI.', description: '<p>Pelatihan keterampilan teknik bangunan mencakup dasar-dasar konstruksi, pengelasan, plumbing, dan pengecatan. Pelatihan ini bersertifikat dan diakui oleh lembaga penempatan.</p>', price: 500000, link: 'https://bp2mi.go.id/pelatihan/teknik-bangunan', course_category: ids.courseCategories['keterampilan'], course_tags: { connect: [ids.courseTags['offline'], ids.courseTags['bersertifikat']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['lembaga-pelatihan-terakreditasi'], target_personas: ['calon-pmi'], is_featured: false, countries: [ids.countries['malaysia'], ids.countries['arab-saudi']] },
    { name: 'Manajemen Keuangan untuk PMI', slug: 'manajemen-keuangan-untuk-pmi', excerpt: 'Pelatihan pengelolaan keuangan dan perencanaan masa depan untuk PMI.', description: '<p>Pelatihan manajemen keuangan ini membantu PMI mengelola penghasilan dengan bijak, termasuk cara menabung, mengirim uang ke tanah air, investasi, dan perencanaan keuangan jangka panjang.</p>', price: 0, link: 'https://bp2mi.go.id/pelatihan/manajemen-keuangan', course_category: ids.courseCategories['manajemen-keuangan'], course_tags: { connect: [ids.courseTags['gratis'], ids.courseTags['online']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['bp2mi'], target_personas: ['pmi-aktif', 'purna-pmi'], is_featured: true, countries: [] },
    { name: 'Pelatihan K3 Konstruksi', slug: 'pelatihan-k3-konstruksi', excerpt: 'Sertifikasi K3 konstruksi untuk PMI di sektor bangunan.', description: '<p>Pelatihan K3 konstruksi memberikan sertifikasi keselamatan dan kesehatan kerja khusus untuk sektor konstruksi. Materi mencakup keselamatan di ketinggian, pengelasan aman, dan penanganan material berat.</p>', price: 750000, link: 'https://bp2mi.go.id/pelatihan/k3-konstruksi', course_category: ids.courseCategories['keselamatan-dan-k3'], course_tags: { connect: [ids.courseTags['offline'], ids.courseTags['bersertifikat']].map(id => ({ documentId: id })) }, learning_platform: ids.learningPlatforms['lembaga-pelatihan-terakreditasi'], target_personas: ['calon-pmi'], is_featured: false, countries: [ids.countries['malaysia'], ids.countries['singapura']] },
  ]

  const resultIds = {}
  for (const course of courses) {
    const { course_category, course_tags, learning_platform, target_personas, is_featured, countries, ...data } = course
    const doc = await strapi.documents(uid).create({
      data: {
        ...data, price: course.price,
        course_category: course_category ? { connect: [{ documentId: course_category }] } : undefined,
        course_tags, learning_platform: learning_platform ? { connect: [{ documentId: learning_platform }] } : undefined,
        target_personas, is_featured,
        countries: countries?.length ? { connect: countries.map(id => ({ documentId: id })) } : undefined,
      },
    })
    await strapi.documents(uid).publish(doc.documentId)
    resultIds[course.slug] = doc.documentId
  }
  console.log(`  Created ${courses.length} courses (published)`)
  return resultIds
}

async function seedAlerts(strapi) {
  console.log('Seeding alerts...')
  const uid = 'api::alert.alert'

  const alerts = [
    { type: 'warning', message: 'Pendaftaran PMI tahap II dibuka hingga 30 Juni 2026', link: 'https://bp2mi.go.id', pages: 'homepage,calon-pmi', active: true },
    { type: 'info', message: 'Segera verifikasi dokumen Anda sebelum keberangkatan', link: '', pages: 'calon-pmi', active: true },
  ]

  for (const alert of alerts) {
    const doc = await strapi.documents(uid).create({ data: alert })
    await strapi.documents(uid).publish(doc.documentId)
  }
  console.log(`  Created ${alerts.length} alerts (published)`)
}

async function seedContentGroupsAndContents(strapi, ids) {
  console.log('Seeding content groups and contents...')
  const cgUid = 'api::content-group.content-group'
  const cUid = 'api::content.content'

  const groups = [
    { title: 'Persiapan Sebelum Berangkat', slug: 'persiapan-sebelum-berangkat', description: 'Panduan lengkap untuk mempersiapkan diri sebelum bekerja ke luar negeri.', content_type: 'content', personas: [ids.personas['calon-pmi']], order: 1, meta_seo: { meta_title: 'Persiapan Sebelum Berangkat - JARI PMI', meta_description: 'Panduan lengkap persiapan PMI sebelum berangkat ke luar negeri' }, contents: [{ title: 'Dokumen yang Wajib Disiapkan', slug: 'dokumen-yang-wajib-disiapkan', excerpt: 'Daftar lengkap dokumen yang perlu disiapkan sebelum berangkat ke luar negeri.', body: '<p>Sebelum berangkat bekerja ke luar negeri, pastikan Anda sudah menyiapkan seluruh dokumen yang diperlukan. Kelengkapan dokumen adalah kunci utama untuk perlindungan dan kelancaran proses penempatan.</p><p>Dokumen wajib meliputi: paspor dengan masa berlaku minimal 2 tahun, visa kerja resmi, kontrak kerja yang telah ditandatangani, sertifikat kesehatan dari puskesmas/rumah sakit terakreditasi, sertifikat pelatihan dari BP2MI, dan surat izin penempatan.</p>', order: 1 }, { title: 'Tips Mengurus Izin Penempatan', slug: 'tips-mengurus-izin-penempatan', excerpt: 'Langkah-langkah mengurus izin penempatan PMI yang sah dan terpercaya.', body: '<p>Izin penempatan adalah dokumen resmi yang dikeluarkan oleh BP2MI sebagai bukti bahwa proses penempatan PMI telah sesuai dengan ketentuan yang berlaku. Mengurus izin penempatan melalui jalur resmi sangat penting untuk perlindungan Anda.</p><p>Proses pengurusan izin penempatan meliputi pendaftaran online melalui SISKOP2MI, verifikasi dokumen, pelaksanaan pelatihan, dan penerbitan izin oleh BP2MI. Hindari calo atau pihak yang menawarkan jasa penempatan ilegal.</p>', order: 2 }] },
    { title: 'Hak dan Perlindungan PMI Aktif', slug: 'hak-dan-perlindungan-pmi-aktif', description: 'Informasi tentang hak dan perlindungan bagi PMI yang sedang bekerja di luar negeri.', content_type: 'content', personas: [ids.personas['pmi-aktif']], order: 2, meta_seo: { meta_title: 'Hak dan Perlindungan PMI Aktif - JARI PMI', meta_description: 'Informasi hak dan perlindungan PMI yang sedang bekerja di luar negeri' }, contents: [{ title: 'Hak Upah dan Tunjangan PMI', slug: 'hak-upah-dan-tunjangan-pmi', excerpt: 'Ketahui hak Anda atas upah dan tunjangan selama bekerja di luar negeri.', body: '<p>Setiap PMI berhak mendapatkan upah sesuai dengan yang tercantum dalam kontrak kerja. Upah harus dibayar tepat waktu dan tidak boleh dipotong tanpa alasan yang sah.</p><p>Selain upah dasar, PMI juga berhak atas tunjangan perumahan, tunjangan transportasi, dan tunjangan makan sesuai ketentuan kontrak kerja. Pastikan Anda memahami seluruh komponen remunerasi sebelum menandatangani kontrak.</p>', order: 1 }, { title: 'Prosedur Pengaduan di Luar Negeri', slug: 'prosedur-pengaduan-di-luar-negeri', excerpt: 'Langkah-langkah yang harus diambil jika mengalami masalah di negara penempatan.', body: '<p>Jika Anda mengalami masalah di negara penempatan, langkah pertama adalah menghubungi KBRI atau KJRI setempat. Mereka akan membantu menyelesaikan masalah Anda sesuai dengan hukum yang berlaku.</p><p>Anda juga dapat mengajukan pengaduan melalui layanan online BP2MI atau menghubungi tim perlindungan PMI. Dokumentasikan semua bukti terkait masalah yang Anda alami.</p>', order: 2 }] },
    { title: 'Panduan untuk Keluarga PMI', slug: 'panduan-untuk-keluarga-pmi', description: 'Informasi dan panduan untuk keluarga Pekerja Migran Indonesia.', content_type: 'content', personas: [ids.personas['keluarga-pmi']], order: 3, meta_seo: { meta_title: 'Panduan untuk Keluarga PMI - JARI PMI', meta_description: 'Informasi dan panduan bagi keluarga Pekerja Migran Indonesia' }, contents: [{ title: 'Cara Berkomunikasi dengan PMI di Luar Negeri', slug: 'cara-berkomunikasi-dengan-pmi-di-luar-negeri', excerpt: 'Tips menjaga komunikasi dengan keluarga yang bekerja di luar negeri.', body: '<p>Komunikasi yang rutin dengan keluarga di luar negeri sangat penting untuk menjaga kesehatan mental dan hubungan keluarga. Manfaatkan teknologi komunikasi seperti video call, pesan teks, dan media sosial.</p><p>Atur jadwal komunikasi yang konsisten dan pastikan untuk selalu menanyakan kondisi kerja dan kesehatan. Jika ada tanda-tanda masalah, segera laporkan ke pihak berwenang.</p>', order: 1 }, { title: 'Mengelola Keuangan Keluarga PMI', slug: 'mengelola-keuangan-keluarga-pmi', excerpt: 'Panduan pengelolaan keuangan bagi keluarga yang menerima remitansi.', body: '<p>Mengelola remitansi dengan bijak adalah kunci untuk memaksimalkan manfaat dari kerja di luar negeri. Buat rencana keuangan keluarga yang mencakup kebutuhan sehari-hari, tabungan, investasi, dan dana darurat.</p><p>Gunakan layanan transfer uang resmi yang terdaftar di Bank Indonesia. Hindari pengiriman uang melalui jalur informal yang berisiko dan tidak terlindungi hukum.</p>', order: 2 }] },
    { title: 'Memulai Kehidupan Baru', slug: 'memulai-kehidupan-baru', description: 'Panduan bagi PMI yang telah selesai bekerja di luar negeri untuk memulai kehidupan baru.', content_type: 'content', personas: [ids.personas['purna-pmi']], order: 4, meta_seo: { meta_title: 'Memulai Kehidupan Baru - JARI PMI', meta_description: 'Panduan bagi Purna PMI untuk memulai kehidupan baru di Indonesia' }, contents: [{ title: 'Program Reintegrasi untuk Purna PMI', slug: 'program-reintegrasi-untuk-purna-pmi', excerpt: 'Informasi tentang program reintegrasi dan dukungan bagi Purna PMI.', body: '<p>Program reintegrasi dirancang untuk membantu Purna PMI kembali beradaptasi dan berkontribusi di Indonesia. Program ini mencakup pelatihan kewirausahaan, bantuan modal usaha, dan konseling karier.</p><p>Manfaatkan program-program reintegrasi yang disediakan oleh pemerintah melalui BP2MI dan Kementerian Ketenagakerjaan. Program ini bertujuan memastikan pengalaman bekerja di luar negeri dapat bermanfaat bagi masa depan Anda di Indonesia.</p>', order: 1 }, { title: 'Tips Berwirausaha Setelah Pulang', slug: 'tips-berwirausaha-setelah-pulang', excerpt: 'Panduan memulai usaha sendiri setelah selesai bekerja di luar negeri.', body: '<p>Bekerja di luar negeri memberikan pengalaman dan modal yang berharga untuk memulai usaha sendiri di Indonesia. Identifikasi keterampilan dan pengetahuan yang Anda peroleh selama bekerja dan bagaimana hal itu dapat diterapkan dalam konteks lokal.</p><p>Langkah-langkah memulai usaha: riset pasar, buat rencana bisnis, daftar program bantuan modal pemerintah, dan jaringan dengan sesama Purna PMI yang sudah berhasil berwirausaha.</p>', order: 2 }] },
  ]

  const groupIds = {}
  for (const group of groups) {
    const { content_type, personas, contents, meta_seo, ...groupData } = group
    const cgDoc = await strapi.documents(cgUid).create({
      data: { ...groupData, content_type, personas: personas?.length ? { connect: personas.map(id => ({ documentId: id })) } : undefined, meta_seo },
    })
    await strapi.documents(cgUid).publish(cgDoc.documentId)
    groupIds[group.slug] = cgDoc.documentId

    for (const content of contents) {
      await strapi.documents(cUid).create({
        data: { title: content.title, slug: content.slug, excerpt: content.excerpt, body: content.body, order: content.order, content_group: { connect: [{ documentId: cgDoc.documentId }] }, meta_seo: { meta_title: content.title, meta_description: content.excerpt } },
      })
    }
  }

  const allContents = await strapi.documents(cUid).findMany({ status: 'draft' })
  for (const c of allContents) {
    await strapi.documents(cUid).publish(c.documentId)
  }

  console.log(`  Created ${groups.length} content groups and ${groups.reduce((sum, g) => sum + g.contents.length, 0)} contents (published)`)
  return groupIds
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