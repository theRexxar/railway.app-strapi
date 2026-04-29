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