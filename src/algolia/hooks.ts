import { Core } from '@strapi/strapi';
import { getAlgoliaClient, getIndexName, isAlgoliaEnabled } from './client';
import { getSearchableTypes, getSearchableTypeByUid } from './config';
import { transformToAlgoliaRecord } from './transformers';
import { buildPopulate } from './utils';

const SEARCHABLE_UIDS = getSearchableTypes().map((t) => t.uid);

async function indexEntry(strapi: Core.Strapi, uid: string, documentId: string) {
  const config = getSearchableTypeByUid(uid);
  if (!config) return;

  try {
    strapi.log.info(`[Algolia] Re-fetching ${config.type}:${documentId} for indexing...`);
    const findOneParams: any = {
      documentId,
      populate: buildPopulate(config.populate),
    };
    if (config.draftAndPublish) {
      findOneParams.status = 'published';
    }
    const entry = await strapi.documents(uid as any).findOne(findOneParams);

    if (!entry) {
      strapi.log.info(`[Algolia] Entry ${config.type}:${documentId} not found in Strapi, removing from index`);
      await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
      strapi.log.info(`[Algolia] Removed missing entry ${config.type}: ${documentId}`);
      return;
    }

    if (config.draftAndPublish && !entry.publishedAt) {
      strapi.log.info(`[Algolia] Entry ${config.type}:${documentId} is a draft, removing from index`);
      await getAlgoliaClient().deleteObject({ indexName: getIndexName(), objectID: documentId });
      strapi.log.info(`[Algolia] Removed unpublished ${config.type}: ${documentId}`);
      return;
    }

    strapi.log.info(`[Algolia] Transforming ${config.type}:${documentId}...`);
    const record = transformToAlgoliaRecord(entry, config);
    if (!record) {
      strapi.log.warn(`[Algolia] transformToAlgoliaRecord returned null for ${config.type}:${documentId}`);
      return;
    }

    strapi.log.info(`[Algolia] Saving ${config.type}:${documentId} to Algolia...`);
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
  const docId =
    event.result?.documentId ??
    event.result?.document_id ??
    event.params?.where?.documentId ??
    event.params?.where?.document_id;
  const numericId = event.result?.id ?? event.params?.where?.id;
  return docId ?? (numericId != null ? String(numericId) : undefined);
}

function logEvent(strapi: Core.Strapi, label: string, event: any) {
  strapi.log.info(
    `[Algolia] ${label} — action=${event.action}, uid=${event.model?.uid}, ` +
    `result.documentId=${event.result?.documentId}, ` +
    `result.document_id=${event.result?.document_id}, ` +
    `result.id=${event.result?.id}, ` +
    `result.publishedAt=${event.result?.publishedAt}, ` +
    `params.where=${JSON.stringify(event.params?.where)}`
  );
}

export function registerAlgoliaHooks(strapi: Core.Strapi) {
  if (!isAlgoliaEnabled()) return;

  try {
    strapi.db.lifecycles.subscribe({
      models: SEARCHABLE_UIDS as any,

      async afterCreate(event: any) {
        try {
          logEvent(strapi, 'afterCreate', event);

          const uid = event.model.uid;
          const config = getSearchableTypeByUid(uid);
          if (!config) {
            strapi.log.warn(`[Algolia] afterCreate: unknown uid=${uid}`);
            return;
          }

          if (config.draftAndPublish) {
            const documentId = getDocumentId(event);
            if (!documentId) {
              strapi.log.warn(`[Algolia] afterCreate: could not resolve documentId for D&P ${uid}`);
              return;
            }

            if (event.result?.publishedAt) {
              strapi.log.info(`[Algolia] afterCreate: ${config.type}:${documentId} is published, indexing`);
              await indexEntry(strapi, uid, documentId);
            } else {
              strapi.log.info(`[Algolia] afterCreate: ${config.type}:${documentId} is a draft, skipping`);
            }
            return;
          }

          const documentId = getDocumentId(event);
          if (!documentId) {
            strapi.log.warn(`[Algolia] afterCreate: could not resolve documentId for ${uid}`);
            return;
          }

          strapi.log.info(`[Algolia] afterCreate: indexing ${config.type}:${documentId}`);
          await indexEntry(strapi, uid, documentId);
        } catch (err: any) {
          strapi.log.error(`[Algolia] afterCreate hook failed — ${err?.message || err}`);
        }
      },

      async afterUpdate(event: any) {
        try {
          logEvent(strapi, 'afterUpdate', event);

          const uid = event.model.uid;
          const config = getSearchableTypeByUid(uid);
          if (!config) {
            strapi.log.warn(`[Algolia] afterUpdate: unknown uid=${uid}`);
            return;
          }

          if (config.draftAndPublish) {
            const documentId = getDocumentId(event);
            if (!documentId) {
              strapi.log.warn(`[Algolia] afterUpdate: could not resolve documentId for D&P ${uid}`);
              return;
            }

            if (event.result?.publishedAt) {
              strapi.log.info(`[Algolia] afterUpdate: ${config.type}:${documentId} is published, indexing`);
              await indexEntry(strapi, uid, documentId);
            } else {
              strapi.log.info(`[Algolia] afterUpdate: ${config.type}:${documentId} is unpublished, removing`);
              await removeObject(documentId, config.type);
            }
            return;
          }

          const documentId = getDocumentId(event);
          if (!documentId) {
            strapi.log.warn(`[Algolia] afterUpdate: could not resolve documentId for ${uid}`);
            return;
          }

          strapi.log.info(`[Algolia] afterUpdate: indexing ${config.type}:${documentId}`);
          await indexEntry(strapi, uid, documentId);
        } catch (err: any) {
          strapi.log.error(`[Algolia] afterUpdate hook failed — ${err?.message || err}`);
        }
      },

      async afterDelete(event: any) {
        try {
          logEvent(strapi, 'afterDelete', event);

          const uid = event.model.uid;
          const config = getSearchableTypeByUid(uid);
          if (!config) {
            strapi.log.warn(`[Algolia] afterDelete: unknown uid=${uid}`);
            return;
          }

          const documentId = getDocumentId(event);
          if (!documentId) {
            strapi.log.warn(`[Algolia] afterDelete: could not resolve documentId for ${uid}`);
            return;
          }

          strapi.log.info(`[Algolia] afterDelete: removing ${config.type}:${documentId}`);
          await removeObject(documentId, config.type);
        } catch (err: any) {
          strapi.log.error(`[Algolia] afterDelete hook failed — ${err?.message || err}`);
        }
      },
    });

    strapi.log.info(`[Algolia] Lifecycle hooks registered for: ${SEARCHABLE_UIDS.join(', ')}`);
  } catch (err: any) {
    strapi.log.error(`[Algolia] Failed to register lifecycle hooks — ${err?.message || err}`);
  }
}