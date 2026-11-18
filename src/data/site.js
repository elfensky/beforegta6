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
// Formspark form beforegta6.wtf: Turnstile, honeypot `gender`, allowed sites apex + staging (API token: 1Password
// Infrastructure/api-formsparks). The Turnstile widget covers both hostnames; its secret sits in the Formspark form.
export const FORMSPARK_FORM_ID = '5jgYkgSh4';
// Infrastructure/api-turnstile-beforegta6.wtf, field Site Key.
export const TURNSTILE_SITE_KEY = '0x4AAAAAAGF2dQXRFBeXk4qk';
// WebMCP origin-trial token (public) for beforegta6.wtf and its subdomains, so visitors' Chrome sees the form as a
// tool. Registered in Andrei's Google account on 2026-11-18. It expires on 2027-03-30 (deploy/README.md § Contact form).
export const WEBMCP_ORIGIN_TRIAL =
  'AqMqD7yleKDv6UBSKRLy3fHi2BF80/+37VkXlX27FOLWmEIZvNh52UoC6HMYP3CGycAYeI+KbUc3hNqgcAqkjAkAAABheyJvcmlnaW4iOiJodHRwczovL2JlZm9yZWd0YTYud3RmOjQ0MyIsImZlYXR1cmUiOiJXZWJNQ1AiLCJleHBpcnkiOjE4MDYzNjQ4MDAsImlzU3ViZG9tYWluIjp0cnVlfQ==';
export const CONTACT_SUBJECTS = [
  'Suggest a card',
  'Fix a card (wrong date or link)',
  'Takedown request',
  'Privacy request',
  'Something else',
];
