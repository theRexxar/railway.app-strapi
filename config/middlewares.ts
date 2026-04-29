import type { Core } from '@strapi/strapi';
import { cacheMiddleware } from '../src/cache/middleware';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
directives: {
          'script-src': ["'self'", "'unsafe-inline'", 'cdn.redoc.ly', 'unpkg.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'unpkg.com'],
          'img-src': ["'self'", 'data:', 'res.cloudinary.com'],
          'media-src': ["'self'", 'res.cloudinary.com'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  cacheMiddleware(),
  'strapi::favicon',
  'strapi::public',
];

export default config;
