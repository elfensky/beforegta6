import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Keys match scripts/lib/candidate.js CardFrontmatter; the import writes them, people edit them.
const cards = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cards' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      blurb: z.string(),
      kind: z.enum(['real-event', 'joke']),
      date: z.coerce.date(),
      eventDate: z.coerce.date().optional(),
      source: z.object({ url: z.url(), platform: z.string(), engagement: z.string().optional() }),
      factUrl: z.url().optional(),
      image: image(),
      imageAlt: z.string(),
      nsfw: z.boolean().default(false),
      status: z.enum(['launch', 'hold', 'drop']).default('launch'),
    }),
});

export const collections = { cards };
