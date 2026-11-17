// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/data/site.js';

export default defineConfig({
  site: SITE_URL,
  image: { service: { entrypoint: './src/lib/social-image-service.js' } },
  trailingSlash: 'always',
  // The oldest-first timeline names / as canonical, and the sent page is noindex: both stay out of the sitemap.
  integrations: [
    sitemap({ filter: (page) => !/\/(?:oldest\/|contact\/sent\/|404(?:\.html|\/)?)$/.test(page) }),
  ],
  // Ship every script as a file: an inlined <script> would need 'unsafe-inline' in the CSP (deploy/nginx.conf).
  vite: { build: { assetsInlineLimit: 0 } },
});
