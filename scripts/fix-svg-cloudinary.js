#!/usr/bin/env node
require('dotenv').config();

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}${process.env.DATABASE_SSL !== 'false' ? '?sslmode=require' : ''}`;

const pool = new Pool({ connectionString: DATABASE_URL });

async function fixSVGs() {
  console.log('Fixing SVG URLs in database...\n');

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, url FROM files WHERE ext = '.svg' AND url NOT LIKE '%/fl_sanitize/%' ORDER BY created_at ASC`
    );

    if (!rows.length) {
      console.log('No SVG files to fix.');
      return;
    }

    console.log(`Found ${rows.length} SVG(s):`);
    rows.forEach((r) => console.log(`  - ${r.name} → ${r.url}`));
    console.log('');

    let fixed = 0;
    for (const row of rows) {
      const parts = row.url.split('/upload/');
      if (parts.length !== 2 || !parts[1].startsWith('v')) {
        console.log(`  SKIP ${row.name}: unexpected URL format → ${row.url}`);
        continue;
      }

      const newUrl = `${parts[0]}/upload/fl_sanitize/${parts[1]}`;

      await client.query('UPDATE files SET url = $1 WHERE id = $2', [newUrl, row.id]);
      console.log(`  OK → ${newUrl}`);
      fixed++;
    }

    console.log(`\nFixed ${fixed}/${rows.length} SVG(s).`);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSVGs().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
