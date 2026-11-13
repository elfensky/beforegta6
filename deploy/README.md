# Deploying beforegta6.wtf

The shape is the usual Arcane Path B (vault `knowledge/homelab/static-sites-on-the-pi-swarm.md`), copied from miklav.com:

| Branch | Compose file | Stack | Swarm | Host | Tunnel secret |
|---|---|---|---|---|---|
| `develop` | `deploy/staging/compose.yaml` | `beforegta6-staging` | Pi swarm, Arcane environment `staging01` | `staging.beforegta6.wtf` | `staging_beforegta6_cloudflared` |
| `main` | `deploy/production/compose.yaml` | `beforegta6` | Hetzner production swarm, Arcane environment `production01` | `beforegta6.wtf` | `beforegta6_cloudflared` |

A push to either branch runs `.github/workflows/build.yml`. It builds `ghcr.io/elfensky/beforegta6:sha-<commit>`
and commits that tag into the branch's compose file. Arcane's Git Sync applies the commit. Nobody edits the `image:`
line by hand. Rollback is `git revert` of the pin commit.

A push that creates `main` at a commit that is already built starts no build (`paths-ignore`). Start it with
`gh workflow run build.yml --ref main`.

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
   - `beforegta6-staging` on `staging01`: branch `develop`, `deploy/staging/compose.yaml`.
   - `beforegta6` on `production01`: branch `main`, `deploy/production/compose.yaml`.
     [drunikbe/infra#75](https://github.com/drunikbe/infra/pull/75) adds it to the `arcane_gitops_syncs` list in
     `vars/arcane-gitops-syncs.yml`, so a rebuild of production01 recreates it.
5. **Mail.** The address `takedown@lav.ren` (footer, privacy page, security.txt).

Still to do:

6. **Cloudflare zone `beforegta6.wtf`.**
   - A Redirect Rule: `https://www.*` → `https://${1}`, 301, keep the query string. Keep a proxied `www` record.
   - A Cache Rule that caches HTML at the edge for 5 minutes, so a traffic spike stays at Cloudflare.
7. **Monitoring.** Add an Umami website and an Uptime Kuma monitor for `https://beforegta6.wtf/`. Put the Umami
   website ID in `src/data/site.js` (`UMAMI_WEBSITE_ID`).

Check: four connectors per tunnel in Zero Trust (two `cloudflared` replicas per stack). Then run the post-deploy block
of the website standard § 0 against the live host.

## Removing or holding a card

Astro ships the original of every image the cards collection imports, linked or not, and `/_astro/` files are cached
for a year. So a card that must not be on the site leaves the collection completely:

- **Takedown:** delete `src/content/cards/<id>.md` and `src/assets/cards/<id>.*` (never a `status` change), merge and
  release. Then purge the card page and its old `/_astro/<id>.*` image URLs in Cloudflare (Caching → Purge by URL).
- **Hold:** move both files to `research/held/`. To launch a held card, move them back and set `status: "launch"`.
  `gta5-farewell-drive` waits there until 2026-11-18. `sex-2` and `durian-condom` wait there until AdSense approves
  the site (Andrei, 2026-11-13). `lesbian-niqabi-muslim` launched with its photo on Andrei's decision (2026-11-13).

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
