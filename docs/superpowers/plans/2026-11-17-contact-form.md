# Contact form and privacy update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/contact/` page that posts to Formspark, and a privacy page that describes Umami in full, the form, and an opt-out.

**Architecture:** Two static Astro pages (`/contact/`, `/contact/sent/`) and a plain HTML form POST to `https://submit-form.com/<id>`. Turnstile and the honeypot stop bots. Two small bundled scripts: one fixes `_redirect` to the current origin, one toggles the Umami opt-out flag.

**Tech Stack:** Astro 7 (static), plain JS + JSDoc, Playwright e2e, Vitest, nginx CSP.

**Spec:** `docs/superpowers/specs/2026-11-17-contact-form-design.md`

## Global Constraints

- Subjects, in this order: `Suggest a card`, `Fix a card (wrong date or link)`, `Takedown request`, `Privacy request`, `Something else`.
- Field names: `email` (required, `type="email"`, `autocomplete="email"`), `subject` (required `<select>`), `link` (optional, `type="url"`), `message` (required `<textarea>`). Visible `<label>` for each.
- Hidden: `_redirect` = `${SITE_URL}/contact/sent/`, `_append` = `false`. Honeypot name `gender`.
- `takedown@lav.ren` stays visible on `/contact/` and in the footer.
- The site's own scripts ship as files (`<script>` in `.astro`, bundled), never inline code. The external Turnstile tag is the one `is:inline` tag: it has a `src` and no body.
- Turnstile `api.js` loads on `/contact/` only.
- Copy: Simplified Technical English, "we" voice as on the current privacy page.

## Review Focus

- A visitor with JavaScript off: the form cannot pass Turnstile, so the page must still show the takedown e-mail. Pinned in Task 1 (no-JS test).
- A staging submission: it must return to `staging.beforegta6.wtf`, not production. Pinned in Task 1 (redirect test).
- Formspark's error redirect to `submitted.formspark.io`: CSP must allow it, or the visitor sees a blocked page. Pinned in Task 1 (CSP unit test).
- Storage blocked (Safari private mode, strict settings): the opt-out button must not throw; it says the choice cannot be saved. Pinned in Task 2.
- The sent page in search: `/contact/sent/` must be `noindex` and out of the sitemap. Pinned in Task 1 (metadata test).

---

### Task 1: Contact page, sent page, CSP and footer

**Files:**
- Modify: `src/data/site.js` — add `FORMSPARK_FORM_ID`, `TURNSTILE_SITE_KEY`, `CONTACT_SUBJECTS`
- Create: `src/pages/contact.astro`, `src/pages/contact/sent.astro`, `src/scripts/contact.js`
- Modify: `src/components/Footer.astro`, `src/pages/llms.txt.js`, `astro.config.mjs` (sitemap filter), `deploy/nginx.conf:48`, `src/styles/global.css`
- Modify: `AGENTS.md` (documented exceptions), `.planning/PROJECT.md:75` (assets constraint), `.planning/REQUIREMENTS.md` (add SITE-07)
- Test: `e2e/contact.spec.js` (new), `e2e/site.spec.js`, `e2e/metadata.spec.js`, `src/__tests__/deploy.test.js`

**Interfaces:**
- Produces: `FORMSPARK_FORM_ID: string`, `TURNSTILE_SITE_KEY: string`, `CONTACT_SUBJECTS: string[]` from `src/data/site.js`.

- [ ] **Step 1: Write the failing tests**

`e2e/contact.spec.js` (block `**/challenges.cloudflare.com/**` with `page.route(..., r => r.abort())` in `beforeEach`):
- `the form posts to Formspark with the redirect and no appended fields`: form `action` = `https://submit-form.com/${FORMSPARK_FORM_ID}`, `method` = `post`; `input[name=_append]` value `false`; `input[name=_redirect]` value = `${baseURL}/contact/sent/` (the script rewrote it to the test origin).
- `the subject list holds the five subjects in order`: `select[name=subject] option` texts (minus an empty first prompt option) equal `CONTACT_SUBJECTS`.
- `the honeypot is out of reach`: `input[name=gender]` has `tabindex="-1"`, `autocomplete="off"`, an `aria-hidden="true"` ancestor, and is not in the accessibility tree (`getByRole('textbox', { name: 'Gender' })` count 0).
- `without JavaScript the page still gives the takedown address` (`javaScriptEnabled: false`): link `takedown@lav.ren` with `href` `mailto:takedown@lav.ren` is visible.

`e2e/site.spec.js`: add `/contact/` and `/contact/sent/` to the axe routes; in the footer test, expect a link `Contact` with `href` `/contact/`.

`e2e/metadata.spec.js`: add `/contact/` to the social-metadata routes; the llms/sitemap list expects `${site}/contact/`; a test `the sent page is noindex` checks `meta[name=robots]` contains `noindex` on `/contact/sent/`.

`src/__tests__/deploy.test.js`: `the CSP lets forms post to Formspark and its error page` — read `deploy/nginx.conf`, the `Content-Security-Policy` line contains `form-action 'self' https://submit-form.com https://submitted.formspark.io`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- deploy && npm run build && npx playwright test contact site metadata --project=chromium`
Expected: FAIL (no `/contact/`, CSP line unchanged).

- [ ] **Step 3: Implement**

- `site.js`: placeholders until Andrei supplies values — `FORMSPARK_FORM_ID = ''` and `TURNSTILE_SITE_KEY = '1x00000000000000000000AA'` (Cloudflare's public always-pass test key), each with a one-line comment naming its 1Password item.
- `contact.astro`: `Base` with `path="/contact/"`; `h1.page-title` "Contact"; a lead line with the takedown e-mail; the form per Global Constraints; the honeypot wrapper reuses the `.sr-only`-style off-screen pattern but is `aria-hidden`; `<div class="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark">`; `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer is:inline>` (external, so no inline code); a submit button; one line linking `/privacy/#contact-form`.
- `src/scripts/contact.js`: set `form [name=_redirect]` value to `new URL('/contact/sent/', location.origin).href`.
- `contact/sent.astro`: `Base` `noindex`, `path="/contact/sent/"`; "Message sent" title and a link back to the timeline.
- Footer: add `<a href="/contact/">Contact</a>` before the Privacy link.
- `llms.txt.js`: add a `Contact` line after Privacy.
- Sitemap filter regex: also exclude `contact/sent/`.
- `nginx.conf`: `form-action 'self' https://submit-form.com https://submitted.formspark.io`.
- CSS: form controls in the site's tokens (`--bg-card`, `--line`, `--text`, `--radius`), full width up to `.prose` width, visible focus (existing `:focus-visible`).
- Docs: AGENTS.md exception "Turnstile's `api.js` loads from Cloudflare on `/contact/` only (Andrei, 2026-11-17)"; PROJECT.md assets line names it; REQUIREMENTS.md `SITE-07: A contact page sends messages through Formspark, with Turnstile and a honeypot; the takedown e-mail stays on the site.`

- [ ] **Step 4: Run the verification gate**

Run: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html" && npm run test:e2e`
Expected: all pass.

- [ ] **Step 5: Commit** — `feat(contact): add the contact page with a Formspark form`

### Task 2: Privacy page — Umami in full, the form, the opt-out

**Files:**
- Modify: `src/pages/privacy.astro`
- Create: `src/scripts/optout.js`
- Test: `e2e/privacy.spec.js` (new)

**Interfaces:**
- Consumes: `/contact/` from Task 1 (the privacy page links it).

- [ ] **Step 1: Write the failing tests** (`e2e/privacy.spec.js`)

- `the opt-out button sets and clears the Umami flag`: click `Stop counting my visits` → `localStorage['umami.disabled']` is `'1'` and the status reads `Not counted.`; the button now reads `Count my visits again`; click → the key is gone and the status reads `Counted.`
- `the opt-out button stays hidden without JavaScript` (`javaScriptEnabled: false`): the button is hidden.
- `a browser that blocks storage gets a message, not an error`: `addInitScript` makes `localStorage.setItem` throw; click → status reads `This browser blocks storage, so the choice cannot be saved.`; no page error.
- `the privacy page names the contact form recipients`: text contains `Formspark` and `Turnstile`, and no longer contains `no forms`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test privacy --project=chromium`
Expected: FAIL.

- [ ] **Step 3: Implement**

`privacy.astro` changes, copy in STE:
- Remove "There are no accounts and no forms." Keep "This site sets no cookies of its own."
- New `h2` "Page views (Umami)": what is recorded per view — page address and title, referring address, browser, operating system, device type, screen size, language, country, region and city from the IP address, and load times (TTFB, FCP, LCP, CLS, INP). The IP address is not stored. Visits are grouped by a code made from the IP address and browser; the code is pseudonymous, not anonymous. Legal basis: legitimate interest in knowing which pages people read and whether the site is fast (GDPR Art. 6(1)(f)). Kept until we delete it; there is no automatic deletion yet. Then the opt-out: a `<button type="button" hidden>` and a `<p role="status">`, plus "The choice is stored in this browser only."
- New `h2 id="contact-form"` "Contact form": the form sends your e-mail address, the subject, the link and your message to Formspark (Trampoline Software SRL, Belgium), which stores them in Ireland and Germany and e-mails them to us. Cloudflare Turnstile checks that a person sends the form, and processes your IP address and browser data for that (link Cloudflare's Turnstile privacy addendum). We use a message only to answer it. Messages are kept until we delete them.
- Update the opening line to link `/contact/` beside the e-mail; set "Last updated" to 17 November 2026.

`src/scripts/optout.js`: read `localStorage.getItem('umami.disabled')` in `try`; set the button text and status; on click `setItem('umami.disabled', '1')` or `removeItem`; on a thrown error, show the blocked-storage message. Unhide the button only when the first read succeeds or fails cleanly.

- [ ] **Step 4: Run the verification gate**

Run: `npm run lint && npm test && npm run build && npx html-validate "dist/**/*.html" && npm run test:e2e`
Expected: all pass.

- [ ] **Step 5: Commit** — `feat(privacy): describe Umami in full, the contact form, and an opt-out`

### Task 3: Real Formspark form and Turnstile key (after Andrei's go)

- [ ] Turnstile widget (Managed) for `beforegta6.wtf` and `staging.beforegta6.wtf`; site key and secret in 1Password `Infrastructure/api-turnstile-beforegta6.wtf`.
- [ ] Formspark form through `POST /forms` (token `Infrastructure/api-formsparks`): `name: "beforegta6.wtf"`, `spamProtection: "TURNSTILE"`, `turnstileSecretKey` piped from 1Password, `customHoneypot: "gender"`, `automaticSpamFilter: true`, `emailThreading: true`, `notificationEmails` per Andrei. Allowed sites in the dashboard (the API does not document them): `beforegta6.wtf` and `staging.beforegta6.wtf`, or the staging check fails.
- [ ] Put the form ID and site key in `src/data/site.js`; run the gate; commit `feat(contact): point the form at the beforegta6 Formspark form`.
- [ ] On staging, after deploy: one real submission arrives; one with `gender` filled does not.
