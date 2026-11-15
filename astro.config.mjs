// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://beforegta6.wtf',
  trailingSlash: 'always',
  // The oldest-first timeline names / as canonical, so it stays out of the sitemap.
  integrations: [sitemap({ filter: (page) => !/\/oldest\/$/.test(page) })],
  // Ship every script as a file: an inlined <script> would need 'unsafe-inline' in the CSP (deploy/nginx.conf).
  vite: { build: { assetsInlineLimit: 0 } },
});
