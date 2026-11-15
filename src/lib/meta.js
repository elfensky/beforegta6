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
