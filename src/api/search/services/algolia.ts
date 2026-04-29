import { algoliasearch, Algoliasearch } from 'algoliasearch';
import { getSearchableTypes } from '../../../algolia/config';

let searchClient: Algoliasearch | null = null;

function getSearchClient(): Algoliasearch {
  if (searchClient) return searchClient;

  const appId = process.env.ALGOLIA_APPLICATION_ID!;
  const apiKey = process.env.ALGOLIA_SEARCH_API_KEY!;
  searchClient = algoliasearch(appId, apiKey);
  return searchClient;
}

function getIndexName(): string {
  return process.env.ALGOLIA_INDEX_NAME || 'jari_pmi_dev';
}

export async function search(
  query: string,
  options: {
    type?: string;
    page?: number;
    hitsPerPage?: number;
    facetFilters?: Record<string, string[]>;
  }
) {
  const client = getSearchClient();
  const indexName = getIndexName();

  const { type, page = 0, hitsPerPage = 20, facetFilters } = options;

  const searchParams: Record<string, any> = {
    query,
    page,
    hitsPerPage,
    facets: ['type'],
  };

  const filters: string[] = [];

  if (type) {
    const types = type.split(',').map((t) => t.trim());
    const typeFilters = types.map((t) => `type:${t}`);
    if (typeFilters.length === 1) {
      filters.push(typeFilters[0]);
    } else {
      filters.push(`(${typeFilters.join(' OR ')})`);
    }
  }

  if (facetFilters) {
    for (const [facet, values] of Object.entries(facetFilters)) {
      const facetFilterStrs = values.map((v) => `${facet}:${v}`);
      if (facetFilterStrs.length === 1) {
        filters.push(facetFilterStrs[0]);
      } else {
        filters.push(`(${facetFilterStrs.join(' OR ')})`);
      }
    }
  }

  if (filters.length > 0) {
    searchParams.filters = filters.join(' AND ');
  }

  return client.searchSingleIndex({
    indexName,
    searchParams,
  });
}