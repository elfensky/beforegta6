// Make the cards match research/candidates.json: write every launch card, remove every other one, keep every image.
// The JSON is the one place to edit: this run overwrites hand edits to a card. Usage: npm run cards
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import {
  cardMarkdown,
  checkCandidates,
  imageExtension,
  reviewTable,
  toCard,
} from './lib/candidate.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const DATA = 'research/candidates.json';
const TABLE = 'research/candidates.md';
const CARDS = 'src/content/cards';
const ASSETS = 'src/assets/cards';
// Astro ships every image the collection imports, so the image of a card that is not live waits here.
const IMAGES = 'research/images';

/** @type {import('./lib/candidate.js').ResearchFile} */
const data = JSON.parse(await readFile(DATA, 'utf8'));
const errors = checkCandidates(data.candidates);
if (errors.length) {
  for (const e of errors) console.error(e);
  console.error(`${errors.length} problems in ${DATA}; nothing written`);
  process.exit(1);
}
// Built before any write: a malformed file stops the run here, with nothing changed.
const table = reviewTable(data);
for (const dir of [CARDS, ASSETS, IMAGES]) await mkdir(dir, { recursive: true });

/** @param {string} file */
const idOf = (file) => file.replace(/\.[^.]+$/, '');

/**
 * Moves the image of `id` between folders. The target keeps one image per id, whatever the extensions.
 * @param {string} id
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string|undefined>} the file name, or undefined when `from` has no image for `id`
 */
async function moveImage(id, from, to) {
  const file = (await readdir(from)).find((f) => idOf(f) === id);
  if (!file) return undefined;
  for (const old of (await readdir(to)).filter((f) => idOf(f) === id)) await rm(`${to}/${old}`);
  await rename(`${from}/${file}`, `${to}/${file}`);
  return file;
}

const launch = data.candidates.filter((c) => c.status === 'launch');
let changed = 0;
/** @type {string[]} */
const fetched = [];
/** @type {string[]} */
const failed = [];
for (const c of launch) {
  try {
    // A hand-saved image wins over the research URL: first the live one, then the one kept while it was not live.
    let image =
      (await readdir(ASSETS)).find((f) => idOf(f) === c.id) ??
      (await moveImage(c.id, IMAGES, ASSETS));
    if (!image) {
      if (!c.image_url)
        throw new Error(
          `image_url missing, so save ${c.id}.jpg (or .png, .webp, .gif) in ${IMAGES}/ by hand`,
        );
      const res = await fetch(c.image_url, { headers: { 'user-agent': UA } });
      const ext = res.ok ? imageExtension(res.headers.get('content-type')) : null;
      if (!ext)
        throw new Error(
          `HTTP ${res.status}, ${res.headers.get('content-type')}: not an image, so save ${c.id}.jpg (or .png, .webp, .gif) in ${IMAGES}/ by hand`,
        );
      image = `${c.id}.${ext}`;
      await writeFile(`${ASSETS}/${image}`, Buffer.from(await res.arrayBuffer()));
      fetched.push(c.id);
    }
    const path = `${CARDS}/${c.id}.md`;
    const md = cardMarkdown(toCard(c).frontmatter, image);
    if (!existsSync(path) || (await readFile(path, 'utf8')) !== md) {
      await writeFile(path, md);
      changed++;
    }
  } catch (err) {
    failed.push(`${c.id} ${c.image_url} — ${/** @type {Error} */ (err).message}`);
  }
}

const live = new Set(launch.map((c) => c.id));
let removed = 0;
for (const f of (await readdir(CARDS)).filter((f) => f.endsWith('.md'))) {
  const id = idOf(f);
  if (live.has(id)) continue;
  // The image first: a failed move then leaves the card in place, not an orphaned image.
  await moveImage(id, ASSETS, IMAGES);
  await rm(`${CARDS}/${f}`);
  removed++;
}

await writeFile(TABLE, table);
console.log(
  `launch ${launch.length}, changed ${changed}, removed ${removed}, fetched ${fetched.length}, failed ${failed.length}`,
);
// Rockstar art and trailer stills reached the cards through image_url once (a21ce3c replaced them by hand).
if (fetched.length)
  console.log(`look at these new images before the merge:\n  ${fetched.join('\n  ')}`);
for (const f of failed) console.log(`  ${f}`);
process.exit(failed.length ? 1 : 0);
