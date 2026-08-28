import type { Core } from '@strapi/strapi';

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => [
  {
    resolve: './src/middlewares/response-time',
  },
  'strapi::logger',
  'strapi::errors',
  {
    name: 'global::force-published',
    resolve: './src/middlewares/force-published',
  },
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          'media-src': ["'self'", 'blob:', 'res.cloudinary.com'],
          'frame-src': ["'self'", 'res.cloudinary.com'],
          'object-src': ["'self'", 'res.cloudinary.com'],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: env.array('CORS_ORIGINS', [
        'https://jaripmi.info',
        'https://staging.jaripmi.info',
      ]),
      credentials: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      jsonLimit: '1mb',
      formLimit: '56kb',
      textLimit: '56kb',
      formidable: {
        maxFileSize: 50 * 1024 * 1024, // 50 MB
      },
    },
  },
  'strapi::session',
  {
    resolve: './src/cache/middleware',
    config: {},
  },
  'strapi::favicon',
  'strapi::public',
];

export default config;
