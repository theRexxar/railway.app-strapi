import type { Schema, Struct } from '@strapi/strapi';

export interface LayoutFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_layout_footer_columns';
  info: {
    description: 'A column of links in the footer';
    displayName: 'Footer Column';
    icon: 'layout';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    links: Schema.Attribute.Component<'shared.link', true>;
  };
}

export interface LayoutSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_layout_social_links';
  info: {
    description: 'Social media link';
    displayName: 'Social Link';
    icon: 'share';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'linkedin']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionAccordionItem extends Struct.ComponentSchema {
  collectionName: 'components_section_accordion_items';
  info: {
    description: 'Collapsible content block';
    displayName: 'Accordion Item';
    icon: 'layer';
  };
  attributes: {
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionFeatureCard extends Struct.ComponentSchema {
  collectionName: 'components_section_feature_cards';
  info: {
    description: 'Icon + title + description card for feature highlights';
    displayName: 'Feature Card';
    icon: 'grid';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.Component<'shared.link', false>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionHero extends Struct.ComponentSchema {
  collectionName: 'components_section_heroes';
  info: {
    description: 'Hero section for pages';
    displayName: 'Hero';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    headline: Schema.Attribute.String & Schema.Attribute.Required;
    highlighted_text: Schema.Attribute.String;
    illustration: Schema.Attribute.Media<'images'>;
    search_placeholder: Schema.Attribute.String;
  };
}

export interface SectionPersonaCard extends Struct.ComponentSchema {
  collectionName: 'components_section_persona_cards';
  info: {
    description: 'One persona option in the selector';
    displayName: 'Persona Card';
    icon: 'user';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Media<'images'>;
    slug: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionStepItem extends Struct.ComponentSchema {
  collectionName: 'components_section_step_items';
  info: {
    description: 'One step in a numbered guide';
    displayName: 'Step Item';
    icon: 'number';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    step_number: Schema.Attribute.Integer & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionTabPanel extends Struct.ComponentSchema {
  collectionName: 'components_section_tab_panels';
  info: {
    description: 'A tab within tabbed content';
    displayName: 'Tab Panel';
    icon: 'tabs';
  };
  attributes: {
    accordions: Schema.Attribute.Component<'section.accordion-item', true>;
    content: Schema.Attribute.RichText;
    steps: Schema.Attribute.Component<'section.step-item', true>;
    tab_label: Schema.Attribute.String & Schema.Attribute.Required;
    tab_slug: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    description: 'Generic link used in nav, footer, CTAs';
    displayName: 'Link';
    icon: 'link';
  };
  attributes: {
    is_external: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'SEO metadata for pages';
    displayName: 'SEO';
    icon: 'search';
  };
  attributes: {
    canonical_url: Schema.Attribute.String;
    meta_description: Schema.Attribute.Text & Schema.Attribute.Required;
    meta_keywords: Schema.Attribute.String;
    meta_title: Schema.Attribute.String & Schema.Attribute.Required;
    share_image: Schema.Attribute.Media<'images'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'layout.footer-column': LayoutFooterColumn;
      'layout.social-link': LayoutSocialLink;
      'section.accordion-item': SectionAccordionItem;
      'section.feature-card': SectionFeatureCard;
      'section.hero': SectionHero;
      'section.persona-card': SectionPersonaCard;
      'section.step-item': SectionStepItem;
      'section.tab-panel': SectionTabPanel;
      'shared.link': SharedLink;
      'shared.seo': SharedSeo;
    }
  }
}
