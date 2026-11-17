# Contact form and privacy update — design

Approved by Andrei on 2026-11-17.

## Intent

Visitors need one place to suggest a card, report a wrong card, or ask for a takedown. The privacy page must describe
Umami in full and describe the new form.

## Goals

- A `/contact/` page with a form. The form has a subject list:
  - Suggest a card
  - Fix a card (wrong date or link)
  - Takedown request
  - Privacy request
  - Something else
- A "Message sent" page at `/contact/sent/`.
- A footer link to `/contact/`.
- A privacy page that states what Umami records, the legal basis, the retention, and an opt-out button. It also names
  Formspark and Cloudflare Turnstile as recipients of form data.

## Non-goals

- No subject preselected from the URL (`?subject=takedown`).
- No own form backend and no stored submissions on the site's servers.
- No change to AdSense or its consent message.

## Anti-goals

- A takedown or a privacy request that only the form can deliver. `takedown@lav.ren` stays on the site, because a
  bot check can block a person.
- Visitor data in a URL. Formspark's redirect must not carry the fields (`_append=false`).

## Constraints

- Static Astro site, nginx, Cloudflare in front. Scripts ship as files, not inline (`astro.config.mjs`).
- CSP `form-action 'self'` (`deploy/nginx.conf`) must allow Formspark's submit and error hosts.
- The house form backend for personal sites is Formspark, with Turnstile and a custom honeypot (vault
  `knowledge/web-programming/formspark.md`, Andrei, 2026-11-17).
- Turnstile's `api.js` loads from Cloudflare and cannot be self-hosted. It is a new documented exception to the
  every-asset-from-the-site rule, limited to `/contact/`.

## Approaches

| Approach | Trade-off | Result |
|---|---|---|
| Formspark + Turnstile + honeypot | No own backend; EU company; one third-party script on one page | **Chosen**: the house standard |
| Own endpoint in the Swarm stack | Full control, but a new service, an SMTP secret and own spam defence | Rejected: more to run for a hobby site |
| `mailto:` form | No backend, but fails for visitors without a mail app | Rejected: unreliable |

HookForms is out: it has no web UI (vault `hookforms.md`).

## Decided

- Fields: `email` (required; Formspark uses it as Reply-To), `subject` (required select), `link` (optional URL),
  `message` (required). No name field: data minimisation.
- Hidden fields: `_redirect` to `/contact/sent/` on the current origin, and `_append=false`.
- Honeypot field `gender`: off screen, `tabindex="-1"`, `aria-hidden`, `autocomplete="off"`. The same name goes in
  the Formspark form settings.
- Turnstile widget in Managed mode on `beforegta6.wtf` and `staging.beforegta6.wtf`. Its secret goes in Formspark.
- The Umami opt-out sets `localStorage['umami.disabled']`, the flag the deployed tracker reads. The button stays
  hidden without JavaScript.
- `/contact/sent/` is `noindex` and stays out of the sitemap and `llms.txt`. `/contact/` goes in both.

## Builder's calls

- `_redirect` holds the production URL in the HTML. A small script changes it to the current origin, so a staging
  submission returns to staging.
- e2e tests block `challenges.cloudflare.com`, so CI does not depend on Cloudflare.
- Until Andrei supplies them, the Formspark form ID and the Turnstile site key are placeholders. Cloudflare's public
  test site key (`1x00000000000000000000AA`) stands in for the real key.

## Prerequisites (Andrei)

- A Formspark form for beforegta6: Turnstile secret, custom honeypot `gender`, allowed sites, notification e-mail.
- A Turnstile widget for both hostnames, stored in 1Password `Infrastructure/api-turnstile-beforegta6.wtf`.
