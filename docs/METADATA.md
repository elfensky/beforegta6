# Link previews and structured data

The shared `src/layouts/Base.astro` writes metadata into static HTML. Crawlers need no JavaScript.

## Social previews

- Open Graph includes the full title, description, canonical URL, site name, English locale, and image details.
- X cards include an explicit title, description, image, and image description, with `summary_large_image`.
- Every preview is a locally served, content-hashed JPEG at 1200 × 630 pixels.
- The image service fits the complete image inside that canvas. Dark borders preserve portrait images and screenshots without cropping.
- Normal page images use Astro's standard image service. Only preview transforms use the fixed canvas.
- NSFW entries use the default site image and its description in every metadata format.
- Social titles retain the full entry title. The browser title keeps its existing length limit.

## Structured data

Each indexable page includes one connected JSON-LD graph with stable production URLs.
The graph describes the WebSite, an ImageObject, and a WebPage or CollectionPage.
The timeline includes an ItemList in the displayed card order. Milestone pages retain their own entry metadata.
Entry pages add breadcrumbs and a CreativeWork with the visible description and source citations.
The graph does not invent publication dates, ratings, search actions, or affiliations.
Event dates are not website publication dates.

JSON-LD escapes less-than signs and Unicode line separators before insertion into HTML.
The 404 page has `noindex` and no structured graph. It stays outside the sitemap.
The oldest-first timeline retains the homepage canonical URL and stays outside the sitemap.
Staging retains nginx's `X-Robots-Tag: noindex` policy.

## Machine-readable index

`/llms.txt` lists the homepage, privacy page, and every selected entry, including milestone pages.
It uses the public content collection. It exposes no review notes, decisions, or excluded entries.
A regression test compares its URLs with the generated sitemap.
This file follows the website handbook's GEO-03 convention. It does not promise crawler adoption or ranking benefits.

## Verification

Unit tests cover JSON-LD escaping, graph references, source citations, and actual image dimensions.
Browser tests read metadata with JavaScript disabled, fetch preview images, and compare timeline lists with visible links.
They also check the NSFW fallback, full titles, sitemap parity, and 404 behavior.
Use `SITE_TEST_PORT=4324 npm run test:e2e` to verify the built site while the local development server remains available.

Platform preview caches can retain an older preview after deployment. Each platform controls the final display.

## References

- [Open Graph protocol](https://ogp.me/) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=3544)
- [Astro image API](https://docs.astro.build/en/reference/modules/astro-assets/) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7082)
- [Google structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=5759)
- [Schema.org CollectionPage](https://schema.org/CollectionPage) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7083)
- [Schema.org CreativeWork](https://schema.org/CreativeWork) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=5758)
- [Schema.org ItemList](https://schema.org/ItemList) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=5757)

**eli14:** A shared link carries a label and a picture. The structured data describes the same page for automatic readers.
