# Metadata verification working notes — 17 November 2026

The first staging request reached the previous deployment during rollout. After rollout, all 206 metadata and image checks passed.

The initial production browser check reported Chromium local-network access errors for `umami.lav.ren`.
Home DNS resolved that name to a private address. Public DNS returned Cloudflare addresses.
A test-only Chromium host resolver override used the public address without disabling browser security.
Both checked pages then passed with zero console or page errors. Ad requests stayed blocked.
No application or infrastructure change was required. The home-DNS analytics limitation remains outside this metadata release.

Public verification must distinguish the home-network route from the public visitor route.
