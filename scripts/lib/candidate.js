// Pure mapping from one research candidate to one card file. No I/O here: scripts/import-cards.js does the fetching.

/**
 * @typedef {object} Candidate
 * @property {string} id
 * @property {string} title
 * @property {string} blurb
 * @property {'real-event'|'joke'} kind
 * @property {string|null} event_date
 * @property {string|null} post_date
 * @property {string|null} timeline_date
 * @property {string|null} fact_url
 * @property {string|null} source_url
 * @property {string} source_platform
 * @property {string|null} source_engagement
 * @property {string|null} image_url
 * @property {string|null} [image_page] Commons file page of the image
 * @property {string|null} [image_license] licence and author, e.g. "CC BY 4.0 (EHT Collaboration)"
 * @property {boolean} [nsfw]
 * @property {'launch'|'hold'|'drop'} [status]
 */

/**
 * @typedef {object} CardFrontmatter
 * @property {string} title
 * @property {string} blurb
 * @property {'real-event'|'joke'} kind
 * @property {string} date
 * @property {string} [eventDate]
 * @property {{ url: string, platform: string, engagement?: string }} source
 * @property {string} [factUrl]
 * @property {string} imageAlt
 * @property {{ text: string, url: string }} [imageCredit]
 * @property {boolean} nsfw
 * @property {'launch'|'hold'|'drop'} status
 */

const ID = /^[a-z0-9-]+$/;

/**
 * @param {Candidate} c
 * @returns {{ id: string, frontmatter: CardFrontmatter }}
 */
export function toCard(c) {
  if (!ID.test(c.id ?? '')) throw new Error(`${c.id}: id must match ${ID}`);
  for (const field of /** @type {const} */ (['title', 'blurb', 'kind', 'source_url'])) {
    if (!c[field]) throw new Error(`${c.id}: ${field} missing`);
  }
  const date = c.timeline_date ?? c.event_date ?? c.post_date;
  if (!date) throw new Error(`${c.id}: date missing`);

  /** @type {CardFrontmatter} */
  const frontmatter = {
    title: c.title,
    blurb: c.blurb,
    kind: c.kind,
    date,
    source: { url: /** @type {string} */ (c.source_url), platform: c.source_platform },
    // The title is the image's purpose on every card; image_note in the research is provenance, not a description.
    imageAlt: c.title,
    nsfw: c.nsfw === true,
    status: c.status ?? 'launch',
  };
  if (c.event_date) frontmatter.eventDate = c.event_date;
  if (c.source_engagement) frontmatter.source.engagement = c.source_engagement;
  if (c.fact_url) frontmatter.factUrl = c.fact_url;
  if (c.image_page && c.image_license)
    frontmatter.imageCredit = { text: c.image_license, url: c.image_page };
  return { id: c.id, frontmatter };
}

/**
 * Every value goes through JSON.stringify: a JSON string or object is valid YAML, so quotes, colons, # and emoji survive.
 * @param {CardFrontmatter} frontmatter
 * @param {string} imageFile file name inside src/assets/cards/
 * @returns {string}
 */
export function cardMarkdown(frontmatter, imageFile) {
  const fields = { ...frontmatter, image: `../../assets/cards/${imageFile}` };
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

/** @type {Record<string, 'jpg'|'png'|'webp'|'gif'>} */
const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/**
 * @param {string|null} contentType
 * @returns {'jpg'|'png'|'webp'|'gif'|null}
 */
export function imageExtension(contentType) {
  const type = contentType?.split(';')[0].trim().toLowerCase() ?? '';
  return EXTENSIONS[type] ?? null;
}
