const MAX_SNIPPET_LENGTH = 300;

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|h[1-6]|blockquote|tr|td|th|thead|tbody|table|ul|ol)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text: string, maxLength: number = MAX_SNIPPET_LENGTH): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.6) {
    return truncated.substring(0, lastSpace) + '...';
  }
  return truncated + '...';
}

export function extractSlug(relation: any): string | null {
  if (!relation) return null;
  if (typeof relation === 'string') return relation;
  return relation.slug || null;
}

export function extractSlugs(relations: any[]): string[] {
  if (!Array.isArray(relations)) return [];
  return relations.map(extractSlug).filter((s): s is string => s !== null);
}

interface ExtractedImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function extractImage(media: any): ExtractedImage | null {
  if (!media) return null;

  if (typeof media === 'string' && media.startsWith('http')) {
    return { url: media };
  }

  if (typeof media === 'object' && media.url) {
    return {
      url: media.url,
      ...(media.width && { width: media.width }),
      ...(media.height && { height: media.height }),
      ...(media.alternativeText && { alt: media.alternativeText }),
    };
  }

  return null;
}

export function buildPopulate(populate: string | Record<string, any> | undefined): Record<string, any> | '*' {
  if (!populate) return '*';
  if (typeof populate !== 'string') return populate;

  const fields: Record<string, boolean> = {};
  for (const field of populate.split(',')) {
    fields[field.trim()] = true;
  }
  return Object.keys(fields).length > 0 ? fields : '*';
}