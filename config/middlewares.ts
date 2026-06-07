import type { Core } from '@strapi/strapi';

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
          'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          'media-src': ["'self'", 'blob:', 'res.cloudinary.com'],
          'frame-src': ["'self'", 'res.cloudinary.com'],
          'object-src': ["'self'", 'res.cloudinary.com'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  {
    resolve: './src/cache/middleware',
    config: {},
  },
  'strapi::favicon',
  'strapi::public',
];

export default config;
