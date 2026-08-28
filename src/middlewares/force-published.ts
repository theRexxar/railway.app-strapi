import type { Core } from '@strapi/strapi';

interface AdminUserLike {
  isActiveAdminUser?: boolean;
  roles?: Array<{ code?: string }>;
}

function isAdminRequest(ctx: any): boolean {
  const user = ctx.state?.user as AdminUserLike | undefined;
  if (!user) return false;
  if (user.isActiveAdminUser) return true;
  if (Array.isArray(user.roles) && user.roles.some((r) => r.code === 'strapi-super-admin')) {
    return true;
  }
  return false;
}

function sanitizeDraftParams(ctx: any): boolean {
  if (!ctx.query || typeof ctx.query !== 'object') return false;

  let mutated = false;

  if (ctx.query.status === 'draft') {
    ctx.query.status = 'published';
    mutated = true;
  }

  if (
    'publicationState' in ctx.query &&
    (ctx.query.publicationState === 'preview' || ctx.query.publicationState === 'draft')
  ) {
    delete ctx.query.publicationState;
    mutated = true;
  }

  if (Array.isArray(ctx.query.filters)) {
    for (const filter of ctx.query.filters) {
      if (filter && typeof filter === 'object' && filter.publishedAt?.$null === true) {
        delete filter.publishedAt;
        mutated = true;
      }
    }
  }

  return mutated;
}

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: () => Promise<any>) => {
    if (!ctx.path.startsWith('/api/')) {
      return next();
    }

    if (isAdminRequest(ctx)) {
      return next();
    }

    sanitizeDraftParams(ctx);

    return next();
  };
};
