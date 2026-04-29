import { Core } from '@strapi/strapi';
import { getAlgoliaClient, getIndexName, isAlgoliaEnabled } from './client';
import { getSearchableTypes, getSearchableTypeByUid } from './config';
import { transformToAlgoliaRecord } from './transformers';

const SEARCHABLE_UIDS = getSearchableTypes().map((t) => t.uid);

async function indexEntry(strapi: Core.Strapi, uid: string, documentId: string) {
  const config = getSearchableTypeByUid(uid);
  if (!config) return;

  const populate: Record<string, boolean> = {};
  if (config.populate) {
    for (const field of config.populate.split(',')) {
      populate[field.trim()] = true;
    }
  }

  const entry = await strapi.documents(uid as any).findOne({
    documentId,
    populate: Object.keys(populate).length > 0 ? (populate as any) : '*',
  });

  if (!entry) {
    await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
    return;
  }

  if (config.draftAndPublish && !entry.publishedAt) {
    await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
    return;
  }

  const record = transformToAlgoliaRecord(entry, config);
  if (!record) return;

  await getAlgoliaClient().saveObject({ indexName: getIndexName(), body: record });
  strapi.log.info(`[Algolia] Indexed ${config.type}: ${documentId}`);
}

async function removeObject(documentId: string, type: string) {
  await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
  strapi.log.info(`[Algolia] Removed ${type}: ${documentId}`);
}

export function registerAlgoliaHooks(strapi: Core.Strapi) {
  if (!isAlgoliaEnabled()) return;

  strapi.db.lifecycles.subscribe({
    models: SEARCHABLE_UIDS as any,

    async afterCreate(event: any) {
      const uid = event.model.uid;
      const config = getSearchableTypeByUid(uid);
      if (!config) return;

      if (config.draftAndPublish) {
        return;
      }

      const documentId = event.result?.documentId;
      if (documentId) {
        await indexEntry(strapi, uid, documentId);
      }
    },

    async afterUpdate(event: any) {
      const uid = event.model.uid;
      const config = getSearchableTypeByUid(uid);
      if (!config) return;

      if (config.draftAndPublish) {
        const documentId = event.result?.documentId;
        if (documentId) {
          const entry = await strapi.documents(uid as any).findOne({
            documentId,
            populate: '*' as any,
          });
          if (entry && entry.publishedAt) {
            await indexEntry(strapi, uid, documentId);
          } else if (entry) {
            await removeObject(documentId, config.type);
          }
        }
        return;
      }

      const documentId = event.result?.documentId;
      if (documentId) {
        await indexEntry(strapi, uid, documentId);
      }
    },

    async afterDelete(event: any) {
      const uid = event.model.uid;
      const config = getSearchableTypeByUid(uid);
      if (!config) return;

      const documentId = event.result?.documentId;
      if (documentId) {
        await removeObject(documentId, config.type);
      }
    },
  });

  strapi.log.info('[Algolia] Lifecycle hooks registered');
}