import type { Core } from '@strapi/strapi';

const PDF_MIME = 'application/pdf';
const PDF_EXT = '.pdf';

function isPdf(file: any): boolean {
  if (!file) return false;
  if (file.mime === PDF_MIME) return true;
  if (file.ext === PDF_EXT) return true;
  if (typeof file.name === 'string' && file.name.toLowerCase().endsWith(PDF_EXT)) return true;
  return false;
}

function patchSvgUrl(file: any) {
  if (file?.url && file.url.endsWith('.svg') && !file.url.includes('/fl_sanitize/')) {
    const parts = file.url.split('/upload/');
    if (parts.length === 2 && parts[1].startsWith('v')) {
      file.url = `${parts[0]}/upload/fl_sanitize/${parts[1]}`;
    }
  }
}

export function patchCloudinaryProvider(strapi: Core.Strapi) {
  try {
    const uploadPlugin = strapi.plugin('upload');
    const provider = (uploadPlugin as any)?.provider;

    if (!provider) {
      strapi.log.warn('[Cloudinary] Upload provider not found, skipping patches.');
      return;
    }

    const originalUpload = provider.upload.bind(provider);
    const originalUploadStream = provider.uploadStream?.bind(provider);

    provider.upload = function (file: any, config?: any) {
      if (isPdf(file)) {
        config = { ...config, resource_type: 'raw' };
        strapi.log.debug(`[Cloudinary] Forcing raw upload for PDF: ${file.name}`);
      }

      if (originalUpload) {
        const result = originalUpload(file, config);
        if (result?.then) {
          return result.then(() => {
            patchSvgUrl(file);
          });
        }
        patchSvgUrl(file);
      }
      return originalUpload(file, config);
    };

    if (originalUploadStream) {
      provider.uploadStream = function (file: any, config?: any) {
        if (isPdf(file)) {
          config = { ...config, resource_type: 'raw' };
          strapi.log.debug(`[Cloudinary] Forcing raw upload for PDF: ${file.name}`);
        }

        const result = originalUploadStream(file, config);
        if (result?.then) {
          return result.then(() => {
            patchSvgUrl(file);
          });
        }
        patchSvgUrl(file);
      };
    }

    strapi.log.info('[Cloudinary] Patches applied (SVG fl_sanitize, PDF raw upload).');
  } catch (err: any) {
    strapi.log.warn(`[Cloudinary] Failed to patch provider: ${err.message}`);
  }
}
