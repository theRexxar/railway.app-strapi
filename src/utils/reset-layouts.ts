import type { Core } from '@strapi/strapi';

const LAYOUT_UIDS = [
  'api::course.course',
  'api::protection-info.protection-info',
  'api::tool.tool',
  'api::country.country',
];

export async function resetContentManagerLayouts(strapi: Core.Strapi) {
  const RESET_MODE = process.env.RESET_LAYOUTS;

  if (!RESET_MODE || RESET_MODE === 'false') return;

  const configService = strapi.plugin('content-manager').service('configuration');

  if (RESET_MODE === 'sync') {
    console.log('[Layout] Syncing all Content Manager configurations...');
    await configService.syncConfigurations();
    console.log('[Layout] Sync complete.');
    return;
  }

  const uids = RESET_MODE === 'true' || RESET_MODE === '*' ? LAYOUT_UIDS : RESET_MODE.split(',').map(s => s.trim());

  console.log('[Layout] Resetting Content Manager layouts...');

  for (const uid of uids) {
    try {
      await configService.deleteConfiguration(uid);
      console.log(`[Layout] Deleted: ${uid}`);
    } catch (err: any) {
      console.warn(`[Layout] Skip ${uid}:`, err.message);
    }
  }

  // Regenerate defaults from schema
  await configService.syncConfigurations();
  console.log('[Layout] Layouts regenerated from schema.');
}
