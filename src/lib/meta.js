import { SITE_NAME, SITE_URL } from '../data/site.js';

const MAX = 70;
const SUFFIX = ' · beforegta6.wtf';
/** @type {Record<string, string>} */
const ESCAPED = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };

// html-validate counts the title as Astro writes it, so an apostrophe (&#39;) counts as 5 characters.
/** @param {string} s */
const htmlLength = (s) => s.replace(/[&<>'"]/g, (c) => ESCAPED[c]).length;

/**
 * A <title> of at most 70 characters (html-validate long-title): the suffix goes first, then the end of the title.
 * @param {string} title
 * @returns {string}
 */
export function pageTitle(title) {
  if (htmlLength(title + SUFFIX) <= MAX) return title + SUFFIX;
  if (htmlLength(title) <= MAX) return title;
  let cut = title;
  while (htmlLength(`${cut}…`) > MAX) cut = cut.slice(0, -1);
  return `${cut}…`;
}
export const SOCIAL_WIDTH = 1200;
export const SOCIAL_HEIGHT = 630;
export const DEFAULT_IMAGE_ALT = 'beforegta6.wtf — Everything we got before GTA 6';

/** @typedef {{ id: string, title: string }} ListedCard */
/** @typedef {{ url: string, width: number, height: number, alt: string }} PreviewImage */
/** @typedef {{ citations: string[], nsfw: boolean }} CardMetadata */

/**
 * Describe published content only. Event dates are not website publication dates.
 * @param {{ title: string, description: string, path: string, image: PreviewImage,
 *   items?: ListedCard[], card?: CardMetadata }} options
 */
export function structuredData({ title, description, path, image, items, card }) {
  const root = `${SITE_URL}/`;
  const url = new URL(path, root).href;
  const website = {
    '@type': 'WebSite',
    '@id': `${root}#website`,
    url: root,
    name: SITE_NAME,
    inLanguage: 'en-GB',
  };
  const picture = {
    '@type': 'ImageObject',
    '@id': `${url}#image`,
    url: image.url,
    contentUrl: image.url,
    width: image.width,
    height: image.height,
    caption: image.alt,
    encodingFormat: 'image/jpeg',
  };
  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: root },
      { '@type': 'ListItem', position: 2, name: title, item: url },
    ],
  };
  const page = {
    '@type': items ? 'CollectionPage' : 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'en-GB',
    isPartOf: { '@id': website['@id'] },
    primaryImageOfPage: { '@id': picture['@id'] },
    ...(card
      ? {
          breadcrumb: { '@id': breadcrumbs['@id'] },
          mainEntity: {
            '@type': 'CreativeWork',
            '@id': `${url}#entry`,
            url,
            name: title,
            description,
            mainEntityOfPage: { '@id': `${url}#webpage` },
            image: { '@id': picture['@id'] },
            citation: [...new Set(card.citations)],
            isFamilyFriendly: !card.nsfw,
            inLanguage: 'en-GB',
          },
        }
      : {}),
    ...(items
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: items.length,
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.title,
              url: new URL(`/${item.id}/`, root).href,
            })),
          },
        }
      : {}),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [website, picture, page, ...(card ? [breadcrumbs] : [])],
  };
}

/** Safe for an HTML script data block, including titles containing </script>. @param {unknown} value */
export function serializeJsonLd(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
