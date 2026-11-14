// One-off import: research candidates → src/content/cards/<id>.md + src/assets/cards/<id>.<ext>.
// It never overwrites an existing card, because hand edits win. Usage: node scripts/import-cards.js research/candidates.json
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { cardMarkdown, imageExtension, toCard } from './lib/candidate.js';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const CARDS = 'src/content/cards';
const ASSETS = 'src/assets/cards';

const [file] = process.argv.slice(2);
if (!file) {
  console.error('usage: node scripts/import-cards.js <candidates.json>');
  process.exit(2);
}
/** @type {{ candidates: import('./lib/candidate.js').Candidate[] }} */
const { candidates } = JSON.parse(await readFile(file, 'utf8'));
await mkdir(CARDS, { recursive: true });
await mkdir(ASSETS, { recursive: true });

const ids = candidates.map((c) => c.id);
const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
if (dupes.length) {
  console.error(`duplicate ids: ${dupes.join(', ')}`);
  process.exit(1);
}

const assets = await readdir(ASSETS);
let imported = 0;
let skipped = 0;
let archived = 0;
/** @type {string[]} */
const failed = [];
for (const c of candidates) {
  // The research file is the archive: only launch candidates become cards. Held cards wait in research/held/.
  if ((c.status ?? 'launch') !== 'launch') {
    archived++;
    continue;
  }
  try {
    const { id, frontmatter } = toCard(c);
    if (existsSync(`${CARDS}/${id}.md`)) {
      skipped++;
      continue;
    }
    // An image saved by hand under the card's id wins over the research URL.
    let image = assets.find((f) => f.replace(/\.[^.]+$/, '') === id);
    if (!image) {
      if (!c.image_url) throw new Error('image_url missing');
      const res = await fetch(c.image_url, { headers: { 'user-agent': UA } });
      const ext = res.ok ? imageExtension(res.headers.get('content-type')) : null;
      if (!ext) throw new Error(`HTTP ${res.status}, ${res.headers.get('content-type')}`);
      image = `${id}.${ext}`;
      await writeFile(`${ASSETS}/${image}`, Buffer.from(await res.arrayBuffer()));
    }
    await writeFile(`${CARDS}/${id}.md`, cardMarkdown(frontmatter, image));
    imported++;
  } catch (err) {
    failed.push(`${c.id} ${c.image_url} — ${/** @type {Error} */ (err).message}`);
  }
}
console.log(
  `imported ${imported}, skipped (exists) ${skipped}, archive only ${archived}, failed ${failed.length}`,
);
for (const f of failed) console.log(`  ${f}`);
process.exit(failed.length ? 1 : 0);
