import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::homepage.homepage', ({ strapi }) => ({
  async find(ctx) {
    const entity = await strapi.documents('api::homepage.homepage').findFirst({
      populate: '*' as any,
    });

    if (!entity) {
      return ctx.notFound('Homepage content not found');
    }

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },
}));