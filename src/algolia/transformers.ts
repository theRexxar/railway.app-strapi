import { SearchableTypeConfig } from './config';
import { stripHtml, truncate, extractSlug, extractSlugs, extractImage } from './utils';

interface AlgoliaRecord {
  objectID: string;
  type: string;
  slug: string;
  title: string;
  excerpt?: string;
  [key: string]: any;
}

export function transformToAlgoliaRecord(
  entry: any,
  config: SearchableTypeConfig
): AlgoliaRecord | null {
  if (!entry) return null;

  const textContent = stripHtml(entry[config.textField] || '');
  const snippet = truncate(textContent);
  const title = entry[config.titleField] || '';

  const record: AlgoliaRecord = {
    objectID: entry.documentId,
    type: config.type,
    slug: entry.slug || '',
    title,
    [config.snippetField]: snippet,
  };

  if (config.excerptField && entry[config.excerptField]) {
    record.excerpt = entry[config.excerptField];
  }

  if (entry.publishedAt) {
    record.published_at = Math.floor(new Date(entry.publishedAt).getTime() / 1000);
  }

  if (entry.updatedAt) {
    record.updated_at = Math.floor(new Date(entry.updatedAt).getTime() / 1000);
  }

  for (const facet of config.facets) {
    const value = entry[facet];

    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      record[facet] = extractSlugs(value);
    } else if (typeof value === 'object') {
      const slug = extractSlug(value);
      if (slug) {
        record[facet] = [slug];
      }
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      record[facet] = value;
    }
  }

  if (config.type === 'content' && entry.content_group) {
    const contentGroup = entry.content_group;
    const contentGroupRecord: Record<string, any> = {
      id: contentGroup.id,
      title: contentGroup.title,
      slug: contentGroup.slug,
    };

    if (Array.isArray(contentGroup.countries)) {
      contentGroupRecord.countries = extractSlugs(contentGroup.countries);
    }
    if (Array.isArray(contentGroup.personas)) {
      contentGroupRecord.personas = extractSlugs(contentGroup.personas);
    }
    if (Array.isArray(contentGroup.service_infos)) {
      contentGroupRecord.service_infos = extractSlugs(contentGroup.service_infos);
    }

    record.content_group = contentGroupRecord;
  }

  if (config.type === 'country' && entry.is_featured !== undefined) {
    record.is_featured = entry.is_featured;
  }

  if (config.type === 'service-info' && entry.is_featured !== undefined) {
    record.is_featured = entry.is_featured;
  }

  if (config.type === 'course' && entry.is_featured !== undefined) {
    record.is_featured = entry.is_featured;
  }

  if (config.imageField) {
    const image = extractImage(entry[config.imageField]);
    if (image) {
      record.image_url = image.url;
      if (image.width) record.image_width = image.width;
      if (image.height) record.image_height = image.height;
      if (image.alt) record.image_alt = image.alt;
    }
  }

  if (entry.icon) {
    const icon = extractImage(entry.icon);
    if (icon) {
      record.icon_url = icon.url;
      if (icon.width) record.icon_width = icon.width;
      if (icon.height) record.icon_height = icon.height;
      if (icon.alt) record.icon_alt = icon.alt;
    }
  }

  return record;
}