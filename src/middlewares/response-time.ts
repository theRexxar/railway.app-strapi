import type { Core } from "@strapi/strapi";

const responseTime: Core.MiddlewareFactory = () => {
  return async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set("X-Response-Time", `${ms}ms`);
    if (ms > 2000) {
      strapi.log.warn(`Slow response: ${ctx.method} ${ctx.url} ${ms}ms`);
    }
  };
};

export default responseTime;
