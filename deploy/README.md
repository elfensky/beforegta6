# Deploying beforegta6.wtf

The shape is the usual Arcane Path B (vault `knowledge/homelab/static-sites-on-the-pi-swarm.md`), copied from miklav.com:

| Branch | Compose file | Stack | Swarm | Host | Tunnel secret |
|---|---|---|---|---|---|
| `develop` | `deploy/staging/compose.yaml` | `beforegta6-staging` | Pi swarm | `staging.beforegta6.wtf` | `staging_beforegta6_cloudflared` |
| `main` | `deploy/production/compose.yaml` | `beforegta6` | Hetzner production swarm | `beforegta6.wtf` | `beforegta6_cloudflared` |

A push to either branch runs `.github/workflows/build.yml`. It builds `ghcr.io/drunikbe/beforegta6.wtf:sha-<commit>`
and commits that tag into the branch's compose file. Arcane's Git Sync applies the commit. Nobody edits the `image:`
line by hand. Rollback is `git revert` of the pin commit.

## One-time setup (Andrei)

1. **Tunnels.** In Cloudflare Zero Trust, create two remotely managed tunnels:
   - `beforegta6-staging`: public hostname `staging.beforegta6.wtf`, pointing to `http://web:80`.
   - `beforegta6`: public hostname `beforegta6.wtf`, pointing to `http://web:80`.
   
   Store each token in 1Password (vault Infrastructure, field `credential`) as `cloudflared-beforegta6.wtf-staging`
   and `cloudflared-beforegta6.wtf-production`.
2. **Swarm secrets.** On each swarm's manager, pipe the token in so it never reaches a terminal:
   `op read "op://Infrastructure/cloudflared-beforegta6.wtf-staging/credential" | docker secret create staging_beforegta6_cloudflared -`
   (Pi swarm), and the same with `-production` → `beforegta6_cloudflared` (production swarm).
3. **Git Sync.** Add two entries to `drunikbe/infra` `vars/arcane-gitops-syncs.yml`: repo `drunikbe/beforegta6.wtf`,
   one on `develop` with `deploy/staging/compose.yaml` on the Pi environment, and one on `main` with
   `deploy/production/compose.yaml` on production01's environment. Both get `redeployAfterSync: true`. The GHCR package
   is private, so Arcane's ghcr credential must be able to read `drunikbe` packages.
4. **Cloudflare zone `beforegta6.wtf`.**
   - A Redirect Rule: `https://www.*` → `https://${1}`, 301, keep the query string. Keep a proxied `www` record.
   - A Cache Rule that caches HTML at the edge for 5 minutes, so a traffic spike stays at Cloudflare.
5. **Monitoring.** Add an Umami website and an Uptime Kuma monitor for `https://beforegta6.wtf/`. Put the Umami
   website ID in `src/data/site.js` (`UMAMI_WEBSITE_ID`).

Check: four connectors per tunnel in Zero Trust (two `cloudflared` replicas per stack). Then run the post-deploy block
of the website standard § 0 against the live host.

## Removing or holding a card

Astro ships the original of every image the cards collection imports, linked or not, and `/_astro/` files are cached
for a year. So a card that must not be on the site leaves the collection completely:

- **Takedown:** delete `src/content/cards/<id>.md` and `src/assets/cards/<id>.*` (never a `status` change), merge and
  release. Then purge the card page and its old `/_astro/<id>.*` image URLs in Cloudflare (Caching → Purge by URL).
- **Hold:** move both files to `research/held/`. To launch a held card, move them back and set `status: "launch"`.
  `gta5-farewell-drive` waits there until 2026-11-18. `lesbian-niqabi-muslim` waits for Andrei, because its image shows a private couple.

`src/__tests__/content.test.js` fails when a card in the collection is not launched.

## AdSense

When the AdSense account has a publisher ID:

1. Set `ADSENSE_CLIENT` (`ca-pub-…`) and `ADSENSE_SLOT` in `src/data/site.js`.
2. Add `public/ads.txt` with `google.com, pub-<id>, DIRECT, f08c47fec0942fa0`.
3. Replace the CSP in `deploy/nginx.conf` with Google's nonce-based policy from
   [AdSense Help: Content Security Policy](https://support.google.com/adsense/answer/16283098). Google publishes no
   host allowlist for its ad code. nginx can stamp a per-request nonce into the HTML with `sub_filter` and
   `$request_id`. A Cloudflare HTML cache would then reuse one nonce per cache lifetime, so decide the Cache Rule
   together with this step.
4. In AdSense, turn on the Privacy & messaging consent message for the EEA, UK and Switzerland.
5. Replace the Ads section of `src/pages/privacy.astro`: what Google collects, the consent choice, and Google's
   partner-sites page.
6. On staging, check the browser console for CSP violations before merging to `main`.
