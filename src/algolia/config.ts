interface SearchableTypeConfig {
  uid: string;
  type: string;
  titleField: string;
  textField: string;
  snippetField: string;
  excerptField?: string;
  facets: string[];
  populate: string;
  draftAndPublish: boolean;
}

const searchableTypes: SearchableTypeConfig[] = [
  {
    uid: 'api::article.article',
    type: 'article',
    titleField: 'title',
    textField: 'content',
    snippetField: 'content_snippet',
    excerptField: 'excerpt',
    facets: ['article_category', 'article_tags', 'author'],
    populate: 'article_category,article_tags,author',
    draftAndPublish: true,
  },
  {
    uid: 'api::service-info.service-info',
    type: 'service-info',
    titleField: 'name',
    textField: 'description',
    snippetField: 'description_snippet',
    excerptField: 'excerpt',
    facets: ['countries'],
    populate: 'countries',
    draftAndPublish: true,
  },
  {
    uid: 'api::course.course',
    type: 'course',
    titleField: 'name',
    textField: 'description',
    snippetField: 'description_snippet',
    excerptField: 'excerpt',
    facets: ['course_category', 'course_tags'],
    populate: 'course_category,course_tags',
    draftAndPublish: true,
  },
  {
    uid: 'api::content.content',
    type: 'content',
    titleField: 'title',
    textField: 'body',
    snippetField: 'body_snippet',
    excerptField: 'excerpt',
    facets: ['content_group'],
    populate: 'content_group',
    draftAndPublish: true,
  },
  {
    uid: 'api::country.country',
    type: 'country',
    titleField: 'name',
    textField: 'description',
    snippetField: 'description_snippet',
    facets: ['region'],
    populate: '',
    draftAndPublish: false,
  },
  {
    uid: 'api::persona.persona',
    type: 'persona',
    titleField: 'name',
    textField: 'description',
    snippetField: 'description_snippet',
    facets: [],
    populate: '',
    draftAndPublish: false,
  },
];

export function getSearchableTypes(): SearchableTypeConfig[] {
  return searchableTypes;
}

export function getSearchableTypeByUid(uid: string): SearchableTypeConfig | undefined {
  return searchableTypes.find((t) => t.uid === uid);
}

export function getSearchableUids(): string[] {
  return searchableTypes.map((t) => t.uid);
}

export type { SearchableTypeConfig };