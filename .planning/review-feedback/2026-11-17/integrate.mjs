// One-time integration of the reviewed proposals. Run from the repository root.
// Re-running refuses to overwrite the completed integration; later corrections use the candidate file.
import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { checkCandidates } from '../../../scripts/lib/candidate.js';

const folder = '.planning/review-feedback/2026-11-17';
const read = async (name) => JSON.parse(await readFile(join(folder, name + '.json'), 'utf8'));
assert(
  !existsSync(join(folder, 'integrated.json')),
  'Already integrated; edit candidates directly.',
);
const original = await readFile('research/candidates.json', 'utf8');
const data = JSON.parse(original);
const before = structuredClone(data);
const notes = (await read('notes')).items;
const editorial = await read('editorial');
const milestones = await read('milestones');
const additional = await read('additional');
const overrides = await read('integration-overrides');
const byId = new Map(data.candidates.map((c) => [c.id, c]));
for (const c of notes) {
  for (const field of ['review_notes', 'review_decision'])
    assert.deepEqual(byId.get(c.id)[field], c[field], `${c.id}: review changed since snapshot`);
}
for (const c of [...editorial.additions, ...additional.additions]) {
  assert(!byId.has(c.id), `Duplicate addition: ${c.id}`);
  data.candidates.push(structuredClone(c));
  byId.set(c.id, data.candidates.at(-1));
}
const patches = [
  ...editorial.updates,
  ...milestones.updates,
  ...additional.updates,
  ...overrides.updates,
  ...overrides.additionOverrides,
];
for (const { id, fields } of patches) {
  assert(byId.has(id), `Unknown update ${id}`);
  assert(!('review_notes' in fields || 'review_decision' in fields), 'Review fields are immutable');
  Object.assign(byId.get(id), fields);
}
// These three proposed pictures show an unrelated event or unsupported data. Replacements are being researched.
const pending = new Set(['ram-shortage', 'spacex-ipo', 'ai-overviews-glue-pizza']);
const remap = {
  'charles-coronation': 'queen-elizabeth-death',
  'bitcoin-round-trip': 'bitcoin-100k',
};
const images = [...(await read('images')).updates, ...additional.images].flatMap((u) => {
  const id = remap[u.id] ?? u.id;
  return pending.has(id) || byId.get(id).merged_into ? [] : [{ ...u, id }];
});
await mkdir(join(folder, 'original-assets'), { recursive: true });
for (const u of images) {
  const source = join(folder, u.local_file);
  assert((await readFile(source)).length > 0, `Empty image: ${source}`);
  for (const dir of ['src/assets/cards', 'research/images']) {
    for (const file of (await readdir(dir)).filter(
      (f) => f.slice(0, -extname(f).length) === u.id,
    )) {
      const backup = join(folder, 'original-assets', file);
      if (!existsSync(backup)) await copyFile(join(dir, file), backup);
      await rm(join(dir, file));
    }
  }
  await copyFile(source, `research/images/${u.id}${extname(source)}`);
  Object.assign(byId.get(u.id), u.fields);
  byId.get(u.id).image_note = `Reviewed image: ${u.local_file}; provenance in ${folder}.`;
}
const selected = new Set(notes.map((c) => c.id));
for (const c of data.candidates) if (c.merged_into) selected.add(c.merged_into);
for (const c of [...editorial.additions, ...additional.additions]) selected.add(c.id);
for (const id of selected) {
  const c = byId.get(id);
  if (c.merged_into || pending.has(id)) continue;
  const files = (
    await Promise.all(['src/assets/cards', 'research/images'].map((dir) => readdir(dir)))
  ).flat();
  assert(
    files.some((f) => f.slice(0, -extname(f).length) === id),
    `${id}: image missing`,
  );
  c.status = 'launch';
  delete c.archive_reason;
}
data.excluded = data.excluded.filter(
  (c) => !['queen-elizabeth-death', 'covid-pandemic'].includes(c.id),
);
const nvidia = data.excluded.find((c) => c.id === 'nvidia-huang-scandal');
nvidia.reason += ' The confirmed corporate resignation has its own nvidia-ceo-probe card.';
for (const c of before.candidates) {
  for (const field of ['review_notes', 'review_decision'])
    assert.deepEqual(byId.get(c.id)[field], c[field], `${c.id}: review field changed`);
}
assert.deepEqual(checkCandidates(data.candidates), []);
assert.equal(
  await readFile('research/candidates.json', 'utf8'),
  original,
  'Concurrent candidate edit',
);
await writeFile(join(folder, 'pre-integration.json'), original);
await writeFile('research/candidates.json', JSON.stringify(data, null, 2) + '\n');
const result = {
  integrated_at: new Date().toISOString(),
  note_count: notes.length,
  updated_images: images.map((u) => u.id),
  additions: [...editorial.additions, ...additional.additions].map((c) => c.id),
  merges: data.candidates
    .filter((c) => c.merged_into)
    .map((c) => ({ id: c.id, into: c.merged_into })),
  pending_images: [...pending],
  launch: data.candidates.filter((c) => c.status === 'launch').length,
  milestones: data.candidates.filter((c) => c.status === 'launch' && c.presentation === 'milestone')
    .length,
};
await writeFile(join(folder, 'integrated.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
