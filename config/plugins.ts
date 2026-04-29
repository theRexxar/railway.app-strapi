import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {
          folder: 'jari-pmi',
        },
      },
    },
  },
  ckeditor5: {
    enabled: true,
  },
  health: {
    enabled: true,
    config: {
      path: '/health',
      cache: false,
      checks: {
        memory: true,
        disk: true,
        database: true,
      },
    },
  },
});

export default config;