import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Create isolated research data. No production selection is read or written. */
export async function reviewFixture() {
  const root = await mkdtemp(join(tmpdir(), 'beforegta6-review-'));
  for (const dir of ['research/images', 'src/assets/cards', 'src/content/cards'])
    await mkdir(join(root, dir), { recursive: true });
  const data = {
    passes: [{ pass: 1, date: '2026-11-16', notes: ['Preserve these notes.'] }],
    excluded: [{ id: 'excluded', reason: 'Preserve this reason.' }],
    extra: { preserve: true },
    candidates: ['first', 'second', 'protected'].map((id) => ({
      id,
      status: id === 'protected' ? 'hold' : 'drop',
      title: id === 'first' ? 'First <script>alert(1)</script>' : id,
      blurb: 'A fixture candidate.',
      kind: 'joke',
      event_date: null,
      post_date: '2026-11-15',
      timeline_date: null,
      source_url: 'https://example.com/source',
      source_platform: 'web',
      fact_url: 'javascript:alert(1)',
      source_engagement: null,
      image_url: null,
      tags: ['tech'],
      provenance: { preserve: true },
    })),
  };
  await writeFile(join(root, 'research/candidates.json'), JSON.stringify(data, null, 2) + '\n');
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGv8AAAAASUVORK5CYII=',
    'base64',
  );
  for (const id of ['first', 'second'])
    await writeFile(join(root, `research/images/${id}.png`), png);
  return { root, data };
}
