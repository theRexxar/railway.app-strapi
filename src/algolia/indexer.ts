import { Core } from '@strapi/strapi';
import { getAlgoliaClient, getIndexName, isAlgoliaEnabled } from './client';
import { getSearchableTypes } from './config';
import { transformToAlgoliaRecord } from './transformers';

export async function reindexAll(strapi: Core.Strapi) {
  if (!isAlgoliaEnabled()) {
    strapi.log.warn('[Algolia] Skipping reindex — not enabled');
    return;
  }

  const client = getAlgoliaClient();
  const indexName = getIndexName();

  strapi.log.info('[Algolia] Clearing index...');
  await client.clearObjects({ indexName });

  const searchableTypes = getSearchableTypes();
  let totalIndexed = 0;

  for (const config of searchableTypes) {
    const populate: Record<string, boolean> = {};
    if (config.populate) {
      for (const field of config.populate.split(',')) {
        populate[field.trim()] = true;
      }
    }

    const findManyParams: any = {
      populate: Object.keys(populate).length > 0 ? populate : '*',
      pageSize: 100,
    };

    if (config.draftAndPublish) {
      findManyParams.status = 'published';
    }

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const entries = await strapi.documents(config.uid as any).findMany({
        ...findManyParams,
        page,
      });

      if (!entries || (Array.isArray(entries) && entries.length === 0)) {
        hasMore = false;
        break;
      }

      const entriesArray = Array.isArray(entries) ? entries : [entries];
      const records = entriesArray
        .map((entry: any) => transformToAlgoliaRecord(entry, config))
        .filter((r: any) => r !== null);

      if (records.length > 0) {
        await client.saveObjects({ indexName, objects: records });
        totalIndexed += records.length;
        strapi.log.info(`[Algolia] Indexed ${records.length} ${config.type} records (page ${page})`);
      }

      if (entriesArray.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  strapi.log.info(`[Algolia] Reindex complete — ${totalIndexed} records indexed`);
}