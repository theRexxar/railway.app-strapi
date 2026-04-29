import { algoliasearch, Algoliasearch } from 'algoliasearch';

let client: Algoliasearch | null = null;

export function getAlgoliaClient(): Algoliasearch {
  if (client) return client;

  const appId = process.env.ALGOLIA_APPLICATION_ID;
  const apiKey = process.env.ALGOLIA_ADMIN_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY are required');
  }

  client = algoliasearch(appId, apiKey);
  return client;
}

export function getIndexName(): string {
  return process.env.ALGOLIA_INDEX_NAME || 'jari_pmi_dev';
}

export function getSearchOnlyClient(): Algoliasearch {
  const appId = process.env.ALGOLIA_APPLICATION_ID;
  const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('ALGOLIA_APPLICATION_ID and ALGOLIA_SEARCH_API_KEY are required');
  }

  return algoliasearch(appId, apiKey);
}

export function isAlgoliaEnabled(): boolean {
  return !!(process.env.ALGOLIA_APPLICATION_ID && process.env.ALGOLIA_ADMIN_API_KEY);
}