import type { Core } from '@strapi/strapi';

export function patchCloudinaryProvider(strapi: Core.Strapi) {
  try {
    const uploadPlugin = strapi.plugin('upload');
    const provider = (uploadPlugin as any)?.provider;

    if (!provider) {
      strapi.log.warn('[Cloudinary] Upload provider not found, skipping SVG patch.');
      return;
    }

    const originalUpload = provider.upload.bind(provider);
    const originalUploadStream = provider.uploadStream?.bind(provider);

    function patchUrl(file: any) {
      if (file?.url && file.url.endsWith('.svg') && !file.url.includes('/fl_sanitize/')) {
        const parts = file.url.split('/upload/');
        if (parts.length === 2 && parts[1].startsWith('v')) {
          file.url = `${parts[0]}/upload/fl_sanitize/${parts[1]}`;
        }
      }
    }

    provider.upload = function (file: any, config?: any) {
      if (originalUpload) {
        const result = originalUpload(file, config);
        if (result?.then) {
          return result.then(() => {
            patchUrl(file);
          });
        }
        patchUrl(file);
      }
      return originalUpload(file, config);
    };

    if (originalUploadStream) {
      provider.uploadStream = function (file: any, config?: any) {
        const result = originalUploadStream(file, config);
        if (result?.then) {
          return result.then(() => {
            patchUrl(file);
          });
        }
        patchUrl(file);
      }
    }

    strapi.log.info('[Cloudinary] SVG URL patch applied (fl_sanitize).');
  } catch (err: any) {
    strapi.log.warn(`[Cloudinary] Failed to patch SVG URLs: ${err.message}`);
  }
}
