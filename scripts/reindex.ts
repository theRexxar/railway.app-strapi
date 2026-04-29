// @ts-nocheck - Standalone reindex script

import { createStrapi } from '@strapi/strapi';

async function reindex() {
  let strapi;
  try {
    strapi = await createStrapi().load();
    const { reindexAll } = await import('../src/algolia/indexer');
    await reindexAll(strapi);
    console.log('\nReindex completed successfully!');
  } catch (err) {
    console.error('Reindex failed:', err);
    process.exit(1);
  } finally {
    if (strapi) {
      await strapi.destroy();
    }
    process.exit(0);
  }
}

reindex();