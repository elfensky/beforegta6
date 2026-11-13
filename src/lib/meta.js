const MAX = 70;
const SUFFIX = ' · beforegta6.wtf';

/**
 * A <title> of at most 70 characters (html-validate long-title): the suffix goes first, then the end of the title.
 * @param {string} title
 * @returns {string}
 */
export function pageTitle(title) {
  if ((title + SUFFIX).length <= MAX) return title + SUFFIX;
  return title.length <= MAX ? title : `${title.slice(0, MAX - 1)}…`;
}
