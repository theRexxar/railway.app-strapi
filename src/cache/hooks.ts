import { Core } from '@strapi/strapi';
import { isCacheEnabled } from './client';
import { getInvalidationRule } from './config';
import { invalidateForContentType, invalidateDetail } from './invalidation';

const CACHEABLE_UIDS = [
  'api::article.article',
  'api::service-info.service-info',
  'api::course.course',
  'api::content.content',
  'api::content-group.content-group',
  'api::country.country',
  'api::faq.faq',
  'api::persona.persona',
  'api::alert.alert',
  'api::announcement.announcement',
  'api::article-category.article-category',
  'api::article-tag.article-tag',
  'api::course-category.course-category',
  'api::course-tag.course-tag',
  'api::learning-platform.learning-platform',
  'api::course-learning-method.course-learning-method',
  'api::curriculum.curriculum',
  'api::author.author',
  'api::global.global',
  'api::homepage.homepage',
  'api::page.page',
];

async function handleCacheInvalidation(strapi: Core.Strapi, uid: string, documentId?: string, slug?: string) {
  if (!isCacheEnabled()) return;

  const rule = getInvalidationRule(uid);
  if (!rule) return;

  await invalidateForContentType(uid);

  if (slug) {
    await invalidateDetail(uid, slug);
  } else if (documentId) {
    try {
      const populate: Record<string, boolean> = {};
      const entry = await strapi.documents(uid as any).findOne({
        documentId,
        populate: { slug: true } as any,
      });
      if (entry?.slug) {
        await invalidateDetail(uid, entry.slug);
      }
    } catch {
      // Entry may have been deleted, slug unavailable — list invalidation is sufficient
    }
  }
}

export function registerCacheHooks(strapi: Core.Strapi) {
  if (!isCacheEnabled()) return;

  strapi.db.lifecycles.subscribe({
    models: CACHEABLE_UIDS as any,

    async afterCreate(event: any) {
      const uid = event.model.uid;
      const documentId = event.result?.documentId;
      await handleCacheInvalidation(strapi, uid, documentId);
    },

    async afterUpdate(event: any) {
      const uid = event.model.uid;
      const documentId = event.result?.documentId;
      await handleCacheInvalidation(strapi, uid, documentId);
    },

    async afterDelete(event: any) {
      const uid = event.model.uid;
      const documentId = event.result?.documentId;
      await handleCacheInvalidation(strapi, uid, documentId);
    },
  });

  strapi.log.info('[Cache] Lifecycle hooks registered');
}