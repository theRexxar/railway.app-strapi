import type { Core } from '@strapi/strapi';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    if (process.env.SEED === 'true') {
      const { seed } = await import('../scripts/seed');
      console.log('SEED=true detected, running seeder...');
      try {
        await seed(strapi);
        console.log('\nSeed completed successfully!');
      } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
      }
    }

    if (process.env.REINDEX === 'true') {
      const { reindexAll } = await import('./algolia/indexer');
      console.log('REINDEX=true detected, running full reindex...');
      try {
        await reindexAll(strapi);
        console.log('\nReindex completed successfully!');
      } catch (err) {
        console.error('Reindex failed:', err);
        process.exit(1);
      }
    }

    const { isAlgoliaEnabled } = await import('./algolia/client');
    if (isAlgoliaEnabled()) {
      const { registerAlgoliaHooks } = await import('./algolia/hooks');
      registerAlgoliaHooks(strapi);
    }

    const { isCacheEnabled } = await import('./cache/client');
    if (isCacheEnabled()) {
      const { registerCacheHooks } = await import('./cache/hooks');
      registerCacheHooks(strapi);
    }
  },
};