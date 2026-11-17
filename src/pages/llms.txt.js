import { getCollection } from 'astro:content';
import { SITE_URL } from '../data/site.js';
import { timelineEntries } from '../lib/cards.js';

export const prerender = true;

/** A public index of the same selected pages used by the site and sitemap. */
export async function GET() {
  const entries = timelineEntries(await getCollection('cards'), [], 'newest');
  const lines = [
    '# beforegta6.wtf',
    '',
    '> A dated archive of things that happened while the world waited for GTA 6, plus internet jokes and GTA milestones.',
    '',
    'Each entry has a description and source links. Event dates describe the subject, not when this website published it.',
    'Some entries contain labelled mature humour. This is an independent hobby site, not an official Rockstar website.',
    '',
    '## Pages',
    '',
    `- [Timeline](${SITE_URL}/): All selected entries, newest first.`,
    `- [Privacy](${SITE_URL}/privacy/): Operator, analytics, advertising, and contact information.`,
    `- [Contact](${SITE_URL}/contact/): Suggest a card, report a wrong card, or ask for a takedown.`,
    '',
    '## Entries',
    '',
    ...entries.flatMap((entry) =>
      entry.kind === 'card'
        ? [
            `- [${entry.card.data.title.replace(/[\\[\]]/g, '\\$&')}](${SITE_URL}/${entry.card.id}/): ${entry.card.data.nsfw ? '(mature) ' : ''}${entry.card.data.blurb.replace(/\s+/g, ' ')}`,
          ]
        : [],
    ),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
