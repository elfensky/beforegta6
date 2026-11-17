# Deploying beforegta6.wtf

The shape is the usual Arcane Path B (vault `knowledge/homelab/static-sites-on-the-pi-swarm.md`), copied from miklav.com:

| Source branch | Deployment branch | Compose file | Stack | Swarm | Host | Tunnel secret |
|---|---|---|---|---|---|---|
| `develop` | `deploy/staging` | `deploy/staging/compose.yaml` | `beforegta6-staging` | Pi swarm, Arcane environment `staging01` | `staging.beforegta6.wtf` | `staging_beforegta6_cloudflared` |
| `main` | `deploy/production` | `deploy/production/compose.yaml` | `beforegta6` | Hetzner production swarm, Arcane environment `production01` | `beforegta6.wtf` | `beforegta6_cloudflared` |

A source-branch push runs `.github/workflows/build.yml`. It builds `ghcr.io/elfensky/beforegta6:sha-<commit>`.
The pin job commits the tag on the corresponding deployment branch. Arcane reads that branch's compose file.
Nobody edits the `image:` line by hand. The job copies compose configuration from the built commit.
It preserves the other environment's image tag. Deployment branches do not trigger builds.

Source branches require PRs and the `check` job. The migration was verified on 2026-11-16.
Integration PRs to `develop` use rebase merges. Release PRs from `develop` to `main` use merge commits.
Deployment branches remain writable by the GitHub Actions token. They contain deployment records, not source integration work.

The source rulesets have no bypass actors. They require zero approving reviews because GitHub prevents self-approval.
Independent review remains part of the delivery workflow. Conversations must be resolved before merge.
The required `check` comes from GitHub Actions, integration ID `15368`, verified from an actual PR check run.
`develop` requires the latest base before merge. `main` requires the check without requiring its tip in `develop`.
Release merge commits remain on `main`, so requiring that ancestry would block the next `develop` release.
Before each release, verify its checks against the current base.

Ruleset fields: [GitHub REST rules](https://docs.github.com/en/rest/repos/rules?apiVersion=2026-03-10) ·
[🔖 2026-11-16](https://linkding.lav.ren/bookmarks?details=6651).

**eli14:** Source branches hold approved changes. Deployment branches hold the image labels read by the servers.
Checks protect the approved changes while automation updates the labels.

The pin job refuses stale builds when source build inputs change. Documentation-only descendants remain safe.
An older job cannot replace a newer image pin. Rejected pushes retry three times without force-pushing.

For rollback, revert the latest pin commit on the affected deployment branch and push that revert.
This restores its previous image and compose configuration. Verify Arcane's service image and the public response.
Future successful source builds can deploy again. Revert the source change through a PR for a lasting rollback.

Pushes limited to root Markdown, `docs/`, `research/`, or `.planning/` start no build (`paths-ignore`). To rebuild production explicitly, run
`gh workflow run build.yml --ref main`.

## Deployment branch migration

Issue #24 moves image pins away from the protected source branches.
Complete these steps in order. Existing image tags remain unchanged during branch creation.

1. Create `deploy/staging` from the current remote `develop` tip and `deploy/production` from the current remote `main` tip.
2. Merge the deployment workflow change into `develop`. Verify that its build updates `deploy/staging` successfully.
3. Change only the staging Arcane Git Sync branch to `deploy/staging`. Verify its service image and public response.
4. Release the workflow change to `main`. Verify that its build updates `deploy/production` successfully.
5. Change only the production Arcane Git Sync branch to `deploy/production`. Verify its service image and public response.
6. Update `vars/arcane-gitops-syncs.yml` in `drunikbe/infra` to recreate production from `deploy/production`.
7. Finish legacy build runs before requiring PRs and `check` on both source branches. Keep force pushes and deletion blocked.

The infrastructure playbook creates missing sync records. It does not update existing records.
The live Arcane branch changes and the recovery registry change are both required.
Migration completed on 2026-11-16. Both environments run the images selected by their deployment branches.
Source rulesets require PRs, resolved conversations, and the GitHub Actions `check` job.
Force pushes and deletion remain blocked. No bypass actors are configured.
The recovery registry change is merged in [drunikbe/infra#79](https://github.com/drunikbe/infra/pull/79).
Image, replica, and ruleset evidence is in `.planning/verification/2026-11-16-completion.md`.

## One-time setup (Andrei)

Done on 2026-11-13:

1. **Tunnels.** Two remotely managed tunnels in Cloudflare Zero Trust. Each sends its public hostname to `http://web:80`.
   - `beforegta6.wtf (staging)` (`72de338b-d963-4e32-bf2f-4332831a590e`): `staging.beforegta6.wtf`.
   - `beforegta6.wtf (production)` (`fde923b6-1b02-4f89-909b-f74c3c6c043d`): `beforegta6.wtf`.
2. **Tokens.** One 1Password item, `cloudflared-beforegta6.wtf` in vault Infrastructure, holds both tunnel tokens:
   field `staging` and field `production` (`op://Infrastructure/cloudflared-beforegta6.wtf/<field>`).
3. **Swarm secrets.** `staging_beforegta6_cloudflared` on `staging01` (`beae5494-3092-481f-b0be-23f5679893ed`) and
   `beforegta6_cloudflared` on `production01` (`153f27a2-bc41-4cc6-8c3f-831c78e28e89`). Arcane's API created them:
   `POST /api/environments/<environment id>/swarm/secrets` with the body
   `{"spec": {"Name": "<secret name>", "Data": "<base64 of the token>"}}`. Encode the token without a trailing newline.
4. **Git Sync.** Arcane Git repository `beforegta6` (`https://github.com/elfensky/beforegta6.git`, auth type none: the
   repo and its GHCR package are public).
   - `beforegta6-staging` on `staging01`: branch `deploy/staging` since 2026-11-16, `deploy/staging/compose.yaml`.
   - `beforegta6` on `production01`: branch `deploy/production` since 2026-11-16, `deploy/production/compose.yaml`.
     [drunikbe/infra#75](https://github.com/drunikbe/infra/pull/75) adds it to the `arcane_gitops_syncs` list in
     `vars/arcane-gitops-syncs.yml`, so a rebuild of production01 recreates it.
5. **Mail.** The address `takedown@lav.ren` (footer, privacy page, security.txt).

Done on 2026-11-14:

6. **www redirect.** Zone `beforegta6.wtf` has the Redirect Rule `Redirect from WWW to root [Template]`:
   `https://www.*` → `https://${1}`, 301, query string kept. The `www` record is a proxied CNAME to the apex.
7. **Monitoring.** Umami website `beforegta6.wtf` (`8c3edd71-c06b-4836-9a7c-38aec4df3a57`, in `src/data/site.js` as
   `UMAMI_WEBSITE_ID`). The tracker counts only the apex (`data-domains`), so staging and local runs stay out of the
   stats. Uptime Kuma monitor 136 `beforegta6.wtf` in group `production`.

Configured and verified on 2026-11-16:

8. **HTML edge cache.** Cloudflare keeps each page for 5 minutes, so a traffic spike stays at the edge (Andrei,
   2026-11-15, for the launch-week push in `docs/PROMOTION.md`). nginx sends Cloudflare
   `CDN-Cache-Control: max-age=300, stale-if-error=86400`, and browsers `Cache-Control: public, max-age=0`. In zone
   `beforegta6.wtf`:
   - Caching → Cache Rules → Create rule. Name: `HTML at the edge`. Custom filter expression:
     `(http.host eq "beforegta6.wtf")`, so staging stays uncached. Cache eligibility: Eligible for cache. Edge TTL: Use
     cache-control header if present, bypass cache if not. Browser TTL: Respect origin.
   - Caching → Tiered Cache: Smart Tiered Caching Topology.
   - Keep Always Online off. Cloudflare ignores `stale-if-error` while it is on.

   The rule is active for the apex only. Tiered Cache uses Automatic Upper Tiers, and Always Online is off.
   Two consecutive production requests returned `cf-cache-status: HIT` with `age: 290` on 2026-11-16.
   The responses retain the five-minute CDN header and the zero-age browser header.

   nginx uses `CDN-Cache-Control`, not `s-maxage`, because an `s-maxage` makes Cloudflare ignore `stale-if-error`
   ([Cloudflare: Cache-Control](https://developers.cloudflare.com/cache/concepts/cache-control/) ·
   [🔖 2026-11-15](https://linkding.lav.ren/bookmarks?details=6461)). When the origin sends `CDN-Cache-Control`,
   Cloudflare caches by it and not by `Cache-Control`
   ([Cloudflare: CDN-Cache-Control](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/) ·
   [🔖 2026-11-15](https://linkding.lav.ren/bookmarks?details=6462)). `stale-if-error` serves the cached page for a
   day while the origin answers `5xx`.

   Check: `/usr/bin/curl -sI https://beforegta6.wtf/ | /usr/bin/grep -i cf-cache-status` shows `HIT` on the second
   request. `REVALIDATED` on each request means Cloudflare follows `Cache-Control` and not `CDN-Cache-Control`. A
   release shows within 5 minutes, or at once after a purge of the page URL. Accepted risk (Andrei, 2026-11-15): for
   up to 5 minutes after a release, a cached old page can ask for `/_astro/` files that the new build does not have.

Check: four connectors per tunnel in Zero Trust (two `cloudflared` replicas per stack). Then run the post-deploy block
of the website standard § 0 against the live host.

`deploy/nginx.conf` sends `/timeline/` to `/` with a 301: the old timeline page was live in production until the line
timeline replaced it (2026-11-15).

## Removing or holding a card

Astro ships the original of every image the cards collection imports, linked or not, and `/_astro/` files are cached
for a year. So a card that must not be on the site leaves the collection completely. `research/candidates.json` decides,
and `npm run cards` moves the files:

- **Hold or archive:** set `status` to `hold` or `drop`, then run `npm run cards`. The card file goes, and its image
  moves to `research/images/`. `gta5-farewell-drive` waits until 2026-11-18. `sex-2` and `durian-condom` wait until
  AdSense approves the site (Andrei, 2026-11-13).
- **Launch:** set `status: "launch"` and run `npm run cards`. It takes the image from `src/assets/cards/`, then from
  `research/images/`, else it fetches `image_url`. To replace an image, delete `<id>.*` in both folders first. Look at
  every image that the run lists as fetched before the merge (no Rockstar art). Four finds have no `image_url`
  (2026-11-15): `aws-outage-2025`, `pope-meets-patriarch`, `uk-age-checks` and `brain-rot-word-of-the-year`. Save
  their image in `research/images/` by hand before a launch.
- **Takedown:** set `status: "drop"`, run `npm run cards`, then delete `research/images/<id>.*`, because the repo is
  public. Merge and release. Then purge the card page and its old `/_astro/<id>.*` image URLs in Cloudflare (Caching →
  Purge by URL).

`src/__tests__/content.test.js` fails when a card is not exactly what `npm run cards` writes for a launch candidate.

## AdSense

Andrei's AdSense account `pub-4995099892738113` started as a hosted AdSense for YouTube account. On 2026-11-15 it was
upgraded at `adsense.google.com/start`, with `beforegta6.wtf` as its site. AdSense allows one account per publisher, so
never create a second one. The site proves ownership with the `google-adsense-account` meta tag (`ADSENSE_ACCOUNT` in
`src/data/site.js`), and `public/ads.txt` names the account as a direct seller. Neither loads Google code.

The site loads AdSense Auto ads, and Google chooses where the ads go (Andrei, 2026-11-15). The site has no ad slots of
its own. Ads appear once AdSense approves the site. Andrei confirmed that review remains pending on 2026-11-16.

- **Apex only.** `ADSENSE_CLIENT` in `src/data/site.js` turns the loader in `src/layouts/Base.astro` on. The loader
  adds Google's script only when the host is `beforegta6.wtf`, so staging and local visits never load real ads
  (Andrei, 2026-11-15). The e2e test "the AdSense script loads on the apex only" holds both sides. Never click an ad on
  any host: a click on your own ad is invalid traffic.
- **CSP.** `deploy/nginx.conf` sends `object-src 'none'; base-uri 'none'; form-action 'self' https://submit-form.com
  https://submitted.formspark.io; frame-ancestors 'none'`, with no `script-src` (Andrei, 2026-11-15). AdSense loads scripts from Google hosts, and Google publishes no host
  allowlist. Google's own policy ([AdSense Help: Content Security Policy](https://support.google.com/adsense/answer/16283098))
  needs a per-request nonce, and that nonce would stop the HTML edge cache (step 8). On this static site it would also
  protect little: nginx would stamp the nonce into every `<script` tag, an injected one too.
- **Hover images.** `.google-auto-placed` in `src/styles/global.css` keeps a row's hover image under an in-page ad.
  Google does not document that class, so check it on the live site once ads show.

In the AdSense dashboard (Andrei):

1. Ads → By site → `beforegta6.wtf`: turn on Auto ads. Look at the placements in the preview. If an in-page ad breaks
   the line timeline, add `.timeline` as an excluded area. Set the density to about one ad per screen (Andrei,
   2026-11-13).
2. Privacy & messaging: create and publish the consent message for the EEA, the UK and Switzerland. The privacy page
   tells visitors that this message comes first.

After each release, check the browser console on `beforegta6.wtf` for CSP violations, with the ad requests blocked
(never click an ad). Only the apex loads Google's script, so staging cannot show a violation that the ads cause.

## Contact form

`/contact/` posts to Formspark, with a Cloudflare Turnstile check and a honeypot field `gender` (vault
`knowledge/web-programming/formspark.md`). `src/data/site.js` holds the public form ID and Turnstile site key. The
form-action entries in the CSP (above) let the form post, and let Formspark redirect to its error page.

One-time setup (Andrei):

1. Turnstile widget (Managed) for `beforegta6.wtf` and `staging.beforegta6.wtf`. Store the site key and the secret in
   1Password `Infrastructure/api-turnstile-beforegta6.wtf`.
2. Formspark form `beforegta6.wtf`: spam protection Turnstile with that secret, custom honeypot `gender`, automatic spam
   filter on, and both hostnames in the allowed sites.
3. Put the form ID and the site key in `src/data/site.js`.

Check on staging after each change to the form: one real message arrives, and one with `gender` filled does not.
