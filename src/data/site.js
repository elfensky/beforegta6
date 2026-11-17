export const SITE_URL = 'https://beforegta6.wtf';
export const SITE_NAME = 'beforegta6.wtf';
// Launch moment: 00:00 on this day in the visitor's own time zone (monthIndex is 0-based).
export const LAUNCH = { year: 2026, monthIndex: 10, day: 19 };
export const TAKEDOWN_EMAIL = 'takedown@lav.ren';
// The publisher ID (public). It verifies site ownership on its own; ads stay off while ADSENSE_CLIENT is empty.
export const ADSENSE_ACCOUNT = 'ca-pub-4995099892738113';
// Empty = off. Set: the apex loads Auto ads, and Google places them (deploy/README.md § AdSense).
export const ADSENSE_CLIENT = ADSENSE_ACCOUNT;
export const UMAMI_WEBSITE_ID = '8c3edd71-c06b-4836-9a7c-38aec4df3a57';
// A personal hobby site: name and contact only, no address (Andrei, 2026-11-13).
export const OPERATOR = 'Andrei Lavrenov';
// The contact form posts to Formspark (vault knowledge/web-programming/formspark.md). Public values: both are in the page.
// shortcut: empty until the beforegta6 form exists in Formspark (1Password Infrastructure/api-formsparks).
export const FORMSPARK_FORM_ID = '';
// shortcut: Cloudflare's always-pass test key until the widget exists (1Password Infrastructure/api-turnstile-beforegta6.wtf).
export const TURNSTILE_SITE_KEY = '1x00000000000000000000AA';
export const CONTACT_SUBJECTS = [
  'Suggest a card',
  'Fix a card (wrong date or link)',
  'Takedown request',
  'Privacy request',
  'Something else',
];
