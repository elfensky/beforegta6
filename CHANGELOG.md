# Changelog

## [0.0.3] - 2026-11-17

- Add a contact page at `/contact/`. It sends messages through Formspark, with a Cloudflare Turnstile check and a honeypot.
- Make the contact form a declarative WebMCP tool: a browser agent can fill it, and the visitor still clicks Send.
- Describe Umami in full on the privacy page, name the contact form's recipients, and add an opt-out button.

## [0.0.2] - 2026-11-17

- Complete Open Graph and X card metadata, including image descriptions, dimensions, and full entry titles.
- Render social previews as 1200 × 630 JPEGs without cropping the reviewed images.
- Add connected Schema.org data for the website, timeline, entries, and breadcrumbs.
- Add a public `llms.txt` index generated from the selected entries.
- Keep NSFW preview images safe and exclude error pages from structured data and the sitemap.
