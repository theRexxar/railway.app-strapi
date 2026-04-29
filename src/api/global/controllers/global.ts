import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::global.global', ({ strapi }) => ({
  async find(ctx) {
    const entity = await strapi.documents('api::global.global').findFirst({
      populate: '*' as any,
    });

    if (!entity) {
      return ctx.notFound('Global configuration not found');
    }

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },
}));