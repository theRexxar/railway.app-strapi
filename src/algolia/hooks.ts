import { Core } from '@strapi/strapi';
import { getAlgoliaClient, getIndexName, isAlgoliaEnabled } from './client';
import { getSearchableTypes, getSearchableTypeByUid } from './config';
import { transformToAlgoliaRecord } from './transformers';

const SEARCHABLE_UIDS = getSearchableTypes().map((t) => t.uid);

async function indexEntry(strapi: Core.Strapi, uid: string, documentId: string) {
  const config = getSearchableTypeByUid(uid);
  if (!config) return;

  try {
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
      strapi.log.info(`[Algolia] Removed missing entry ${config.type}: ${documentId}`);
      return;
    }

    if (config.draftAndPublish && !entry.publishedAt) {
      await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
      strapi.log.info(`[Algolia] Removed unpublished ${config.type}: ${documentId}`);
      return;
    }

    const record = transformToAlgoliaRecord(entry, config);
    if (!record) return;

    await getAlgoliaClient().saveObject({ indexName: getIndexName(), body: record });
    strapi.log.info(`[Algolia] Indexed ${config.type}: ${documentId}`);
  } catch (err: any) {
    strapi.log.error(`[Algolia] Failed to index ${config.type}:${documentId} — ${err?.message || err}`);
  }
}

async function removeObject(documentId: string, type: string) {
  try {
    await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
    strapi.log.info(`[Algolia] Removed ${type}: ${documentId}`);
  } catch (err: any) {
    strapi.log.error(`[Algolia] Failed to remove ${type}:${documentId} — ${err?.message || err}`);
  }
}

function getDocumentId(event: any): string | undefined {
  return event.result?.documentId ?? event.params?.where?.documentId;
}

export function registerAlgoliaHooks(strapi: Core.Strapi) {
  if (!isAlgoliaEnabled()) return;

  strapi.db.lifecycles.subscribe({
    models: SEARCHABLE_UIDS as any,

    async afterCreate(event: any) {
      try {
        const uid = event.model.uid;
        const config = getSearchableTypeByUid(uid);
        if (!config) return;

        if (config.draftAndPublish) {
          return;
        }

        const documentId = getDocumentId(event);
        if (documentId) {
          await indexEntry(strapi, uid, documentId);
        }
      } catch (err: any) {
        strapi.log.error(`[Algolia] afterCreate hook failed — ${err?.message || err}`);
      }
    },

    async afterUpdate(event: any) {
      try {
        const uid = event.model.uid;
        const config = getSearchableTypeByUid(uid);
        if (!config) return;

        if (config.draftAndPublish) {
          const documentId = getDocumentId(event);
          if (documentId) {
            const entry = await strapi.documents(uid as any).findOne({ documentId });
            if (entry && entry.publishedAt) {
              await indexEntry(strapi, uid, documentId);
            } else if (entry) {
              await removeObject(documentId, config.type);
            }
          }
          return;
        }

        const documentId = getDocumentId(event);
        if (documentId) {
          await indexEntry(strapi, uid, documentId);
        }
      } catch (err: any) {
        strapi.log.error(`[Algolia] afterUpdate hook failed — ${err?.message || err}`);
      }
    },

    async afterDelete(event: any) {
      try {
        const uid = event.model.uid;
        const config = getSearchableTypeByUid(uid);
        if (!config) return;

        const documentId = getDocumentId(event);
        if (documentId) {
          await removeObject(documentId, config.type);
        }
      } catch (err: any) {
        strapi.log.error(`[Algolia] afterDelete hook failed — ${err?.message || err}`);
      }
    },
  });

  strapi.log.info(`[Algolia] Lifecycle hooks registered for: ${SEARCHABLE_UIDS.join(', ')}`);
}