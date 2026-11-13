import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      '.superpowers/',
    ],
  },
  js.configs.recommended,
  ...astro.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
];
