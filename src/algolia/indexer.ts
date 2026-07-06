import { Core } from '@strapi/strapi';
import { getAlgoliaClient, getIndexName, isAlgoliaEnabled } from './client';
import { getSearchableTypes } from './config';
import { transformToAlgoliaRecord } from './transformers';
import { buildPopulate } from './utils';

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
    const findManyParams: any = {
      populate: buildPopulate(config.populate),
    };

    if (config.draftAndPublish) {
      findManyParams.status = 'published';
    }

    const PAGE_SIZE = 100;
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const entries = await strapi.documents(config.uid as any).findMany({
        ...findManyParams,
        start,
        limit: PAGE_SIZE,
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
        strapi.log.info(`[Algolia] Indexed ${records.length} ${config.type} records (start ${start})`);
      }

      if (entriesArray.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        start += PAGE_SIZE;
      }
    }
  }

  strapi.log.info(`[Algolia] Reindex complete — ${totalIndexed} records indexed`);
}