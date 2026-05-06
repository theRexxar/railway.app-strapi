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

  const uids = RESET_MODE === 'true' || RESET_MODE === '*' ? LAYOUT_UIDS : RESET_MODE.split(',').map(s => s.trim());

  console.log('[Layout] Resetting Content Manager layouts...');

  const client = strapi.config.get('database.connection.client');

  for (const uid of uids) {
    try {
      const key = `plugin_content_manager_configuration_content_types::${uid}`;

      if (client === 'postgres' || client === 'pg') {
        await strapi.db.connection.raw(`DELETE FROM strapi_core_store_settings WHERE key = ?`, [key]);
      } else {
        await strapi.db.connection('strapi_core_store_settings').where({ key }).del();
      }

      console.log(`[Layout] Reset: ${uid}`);
    } catch (err: any) {
      console.warn(`[Layout] Could not reset ${uid}:`, err.message);
    }
  }

  console.log('[Layout] Done.');
}
