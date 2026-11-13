// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://beforegta6.wtf',
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Ship every script as a file: an inlined <script> would need 'unsafe-inline' in the CSP (deploy/nginx.conf).
  vite: { build: { assetsInlineLimit: 0 } },
});
