# Batch 3 image sources

The manifest is `images.json`: 16 IDs, 16 ready, 0 blocked. Each source page was read through the Commons API on 2026-11-17 and archived in linkding.

## Changed from the saved selection

- `twitter-280-characters`: the 2012–2023 Twitter bird (Apache 2.0, Twitter, Inc.) replaces the X logo. The X logo dates from 2023 and is black on a transparent background, so it is invisible on the black card.
- `roman-telescope-launch`: the NASA launch photo (NASA/Joel Kowsky, 30 August 2026) replaces the artist illustration.
- `japan-floppy-disks`: a photo of floppy disks (George Chernilevsky, PD) replaces the photo of floppy disk drives.
- `mt-gox-collapse`: the Mt. Gox logo, on white, replaces the price chart. The chart page names bitcoincharts.com as author, but the uploader applied `{{self}}`, so its licence is undocumented. A photo of Cross Office Shibuya Medio (CC0, 2 March 2014) was rejected. Only ja.wikipedia's caption ties that building to Mt. Gox. CoinDesk reported that the post-move address was possibly a virtual office: [CoinDesk, 20 Feb 2014](https://www.coindesk.com/markets/2014/02/20/bitcoin-price-hits-135-on-mt-gox-following-office-move-and-verification-demand/) · [🔖 2026-11-17](https://linkding.lav.ren/bookmarks?details=7014).

## Factual notes for the parent

- `r-place-2017`: the saved `image_note` says "the final r/place canvas". The file is the r/place logo. Commons holds no licensed copy of the final 2017 canvas.
- `blackberry-end-of-life`: only the BlackBerry Classic in the photo runs BlackBerry 10.
- `north-macedonia`: the photo shows the signing on 17 June 2018, not the name change of 12 February 2019.
- `twitter-280-characters`: the record has `verified: false`.

## Files

- `assets/`: the 16 final images. `rejected/`: replaced saved images. `alt/`: alternatives that were checked.
- `meta/`: Commons API metadata, search output, archive links.
- `commons-meta.py`, `commons-search.py`, `download.sh`, `build-manifest.py`, `flatten-on-white.swift`: the scripts that produced the output.
