# Pages

7 page types. Personae are enum values within the Persona Page, not separate page types.

## 1. Homepage `/`

├── Hero
├── Persona Modal
│   └── Persona Cards (Calon PMI, PMI Aktif, Keluarga PMI, Purna PMI)
├── Informasi Layanan
├── Negara Tujuan
├── Pelatihan
├── Artikel Terbaru
└── Layanan Pengaduan (Footer)

## 2. Persona Page `/<persona-slug>`

Personae: calon-pmi, pmi-aktif, keluarga-pmi, purna-pmi

├── Hero Menu Persona
│   └── Content Group
│       ├── Content Group Title
│       ├── Content Group Description
│       ├── Content Titles
│       └── Content
├── Penting Diketahui
├── Alat Bantu
├── Negara Tujuan
└── Pelatihan

## 3. Content Group Page `/konten/:groupSlug`

├── Group Header
├── Group Description
├── Content Titles
└── Content

## 4. Pelatihan Page `/pelatihan`

├── Cari Pelatihan
├── Filter Pelatihan
└── List Pelatihan

## 5. Pelatihan Detail Page `/pelatihan/:slug`

├── Title
├── Informasi Pelatihan
├── Deskripsi
└── Kurikulum

## 6. List Artikel Page `/artikel`

├── Page Header
├── Artikel Terbaru
└── Filter

## 7. Artikel Page `/artikel/:slug`

├── Cover
├── Title & Meta
├── Content
└── Related Articles