import type { Core } from '@strapi/strapi';

const PDF_MIME = 'application/pdf';
const PDF_EXT = '.pdf';
const PDF_MAGIC = Buffer.from('%PDF-');

function isPdf(file: any): boolean {
  if (!file) return false;
  if (file.mime === PDF_MIME) return true;
  if (file.ext === PDF_EXT) return true;
  if (typeof file.name === 'string' && file.name.toLowerCase().endsWith(PDF_EXT)) return true;
  return false;
}

function validatePdfBytes(file: any, log: any): { valid: boolean; detail: string } {
  if (!file) return { valid: false, detail: 'no file' };

  if (Buffer.isBuffer(file.buffer) && file.buffer.length >= 5) {
    const head = file.buffer.slice(0, 5).toString('hex');
    const hasMagic = file.buffer.slice(0, 5).equals(PDF_MAGIC);
    if (hasMagic) {
      return { valid: true, detail: `magic bytes OK (${head})` };
    }
    return { valid: false, detail: `bad magic bytes: ${head}` };
  }

  if (file.stream) {
    return { valid: true, detail: 'stream — cannot inspect (check post-upload)' };
  }

  return { valid: false, detail: 'no buffer or stream' };
}

function patchSvgUrl(file: any) {
  if (file?.url && file.url.endsWith('.svg') && !file.url.includes('/fl_sanitize/')) {
    const parts = file.url.split('/upload/');
    if (parts.length === 2 && parts[1].startsWith('v')) {
      file.url = `${parts[0]}/upload/fl_sanitize/${parts[1]}`;
    }
  }
}

function wrapUpload(originalFn: any, strapi: Core.Strapi) {
  return function (file: any, config?: any) {
    if (isPdf(file)) {
      config = { ...config, resource_type: 'raw' };

      const { valid, detail } = validatePdfBytes(file, strapi.log);
      strapi.log.info(
        `[Cloudinary] PDF upload "${file.name}" | pre-upload check: ${valid ? 'VALID' : 'CORRUPT'} | ${detail}`
      );

      if (!valid && detail !== 'stream — cannot inspect (check post-upload)') {
        strapi.log.warn(
          `[Cloudinary] PDF "${file.name}" appears corrupted before upload. Upload is likely to fail. Check Strapi body parser or middleware.`
        );
      }
    }

    if (originalFn) {
      const result = originalFn(file, config);
      if (result?.then) {
        return result.then(() => {
          patchSvgUrl(file);
        });
      }
      patchSvgUrl(file);
    }
    return originalFn(file, config);
  };
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

    provider.upload = wrapUpload(originalUpload, strapi);

    if (originalUploadStream) {
      provider.uploadStream = wrapUpload(originalUploadStream, strapi);
    }

    strapi.log.info('[Cloudinary] Patches applied (SVG fl_sanitize, PDF raw upload + magic-byte check).');
  } catch (err: any) {
    strapi.log.warn(`[Cloudinary] Failed to patch provider: ${err.message}`);
  }
}
