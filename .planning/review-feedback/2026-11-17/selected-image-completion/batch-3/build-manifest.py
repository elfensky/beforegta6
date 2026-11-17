# Build images.json from meta + per-id notes. Run from the batch-3 directory with python3 -I.
import json, hashlib, subprocess, os
REL = '.planning/review-feedback/2026-11-17/selected-image-completion/batch-3/'
meta = json.load(open('meta/commons-saved.json')); meta.update({
    'twitter-280-characters': json.load(open('meta/commons-alt-all.json'))['twitter-logo'],
    'roman-telescope-launch': json.load(open('meta/commons-alt-all.json'))['roman-launch-36'],
    'japan-floppy-disks': json.load(open('meta/commons-alt-all.json'))['floppy-g1'],
    'mt-gox-collapse': json.load(open('meta/commons-alt-all.json'))['mtgox-logo']})
arch = dict(l.rstrip('\n').split('\t') for l in open('meta/archive.tsv'))
pages = dict(l.rstrip('\n').split('\t') for l in open('sources.tsv'))
files = {f.rsplit('.', 1)[0]: f for f in os.listdir('assets')}
N = {  # id: (licence + credit, image_note, inspection_note)
 'thailand-same-sex-marriage': ('CC BY-SA 4.0 — Chainwit.', 'Hand-painted banner reading "สมรสเท่าเทียม" ("equal marriage"), Bangkok Pride 2022. Campaign photo from before the law; it does not show the 23 January 2025 weddings.', 'Banner text sharp and centred; bright daytime photo, reads well on the black card.'),
 'turkey-to-turkiye': ('Public domain (national flag; Commons file by David Benbennick, PD-ineligible)', 'National flag of Türkiye, rendered from the Commons SVG. Illustrative; not a photo of the UN name change.', 'Red flag, crescent and star clear; no transparency.'),
 'twitter-280-characters': ('Apache License 2.0 — Twitter, Inc. (logo design: Martin Grasser); trademarked', 'The blue Twitter bird logo used 2012–2023, so it matches the 2017 280-character change. Replaces the saved X logo (2023, anachronistic, and black on transparent, invisible on the black card). Commons licence review: King of Hearts, 2021-12-07, against twitter/opensource-website LICENSE. Trademark rights remain with X Corp.', 'Blue bird on transparent background; clearly visible on the black card.'),
 'un-correct-the-map': ('CC BY-SA 4.0 — Dariusz Kowalczyk (User:Darekk2)', 'Comparison map: Mercator (left) and Equal Earth (right) with Africa and Greenland highlighted. Explanatory map, not a frame of the UN vote.', 'Labels legible at 1200 px; light map panel on white, letterboxed on black card.'),
 'blackberry-end-of-life': ('CC BY-SA 4.0 — Kt38138', 'BlackBerry 8820, Bold 9900 and Classic phones. Only the Classic (right) runs BlackBerry 10; the other two run the older BlackBerry OS.', 'Phones and logos visible; dark cloth background, so the image is dark but the lit phone faces separate from the card.'),
 'google-plus-shutdown': ('Public domain (PD-textlogo) — Google LLC; trademarked', 'The Google+ wordmark.', 'Transparent PNG; coloured letters and grey "+" (#757575) stay legible on the black card.'),
 'japan-floppy-disks': ('Public domain — George Chernilevsky (released by author)', '8-inch, 5.25-inch and 3.5-inch floppy disks. Generic illustration of the medium; not Japanese government media. Replaces the saved photo, which shows floppy disk drives, not disks.', 'Three disks clearly visible on light background; labels readable.'),
 'mt-gox-collapse': ('Public domain (PD-textlogo) — Mt. Gox Co., Ltd. logo, author unknown; trademarked', 'The Mt. Gox logo, from Commons (source: Mt. Gox OTP card PDF, archived 2014-01-22). Rendered from the Commons thumbnail and placed on a white 4:3 canvas (local CoreGraphics tool, flatten-on-white.swift) because the dark-grey "GOX" is unreadable on the black card. No artwork changed. Replaces the saved price chart: its page credits bitcoincharts.com as author but the uploader applied {{self}}, so the CC BY-SA claim is undocumented.', 'Logo centred on white; orange and grey parts fully legible.'),
 'north-macedonia': ('Public domain (Public Domain Mark by the author, Flickr review passed 2020-08-27) — Government of the Republic of Macedonia', 'Signing of the Prespa agreement, 17 June 2018: foreign ministers Nikola Dimitrov and Nikos Kotzias sign, prime ministers Zoran Zaev and Alexis Tsipras stand behind. Signing date, not the 12 February 2019 name change.', 'Sharp event photo, flags of both countries visible.'),
 'penguin-tariffs': ('CC BY 2.0 — laikolosse (Flickr review passed 2026-04-06)', 'King penguins at Corinthian Bay, Heard Island.', 'Penguins clear in foreground; grey palette but good contrast.'),
 'r-place-2017': ('Public domain (PD-logo) — Reddit', 'The r/place 2017 logo (16-colour grid). Correction: the saved note called this "the final r/place canvas"; it is the logo. No licensed copy of the final canvas exists on Commons; it contains third-party artwork.', 'Coloured squares and white grid; no transparency, distinct on black.'),
 'roman-telescope-launch': ('Public domain (PD-USGov-NASA) — NASA/Joel Kowsky', 'SpaceX Falcon Heavy launches the Nancy Grace Roman Space Telescope from Launch Complex 39A, Kennedy Space Center, 30 August 2026. Real launch photo; replaces the saved artist illustration.', 'Rocket, plume and pad clear; good detail.'),
 'sspx-schism': ('Public domain — Jastrow (released by author)', 'Façade of Saint-Nicolas-du-Chardonnet, Paris, an SSPX-held church. Generic illustration; not a photo of the 1 July 2026 consecrations.', 'Bright, sharp architecture photo; portrait, letterboxed in 4:3.'),
 'swaziland-to-eswatini': ('CC BY 2.0 — Sara Atkins', 'Landscape in Eswatini (Flickr photo titled "Swaziland", uploaded 2008). Generic illustration of the country, not the 2018 announcement.', 'Wide panorama; letterboxed in 4:3 but clear.'),
 'tilcayo-new-cat': ('CC BY-SA 4.0 — Paola Nogales Ascarrunz (VRT permission ticket 2026091910006001)', 'A tilcayo (Leopardus tilcayo) on a perch in front of fencing, photo by researcher Paola Nogales Ascarrunz; the setting appears to be an enclosure.', 'Cat sharp and centred, green background.'),
 'aol-dial-up-end': ('CC BY-SA 3.0 — Oona Räisänen', 'Annotated spectrogram of a dial-up modem handshake. Explains dial-up generally; not AOL-specific.', 'Dark-background diagram; title readable, small annotations become fine print at card size.'),
}
out = []
for cid, (lic, note, insp) in N.items():
    m = meta[cid]; f = files[cid]
    w, h = [int(x.split(':')[1]) for x in subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', 'assets/' + f], capture_output=True, text=True).stdout.strip().splitlines()[1:]]
    out.append({'id': cid, 'status': 'ready', 'asset': REL + 'assets/' + f, 'image_url': m['thumb'] or m['url'], 'image_page': pages[cid], 'image_license': lic, 'image_note': note, 'width': w, 'height': h, 'sha256': hashlib.sha256(open('assets/' + f, 'rb').read()).hexdigest(), 'inspected': True, 'inspection_note': insp, 'source_checked_at': '2026-11-17', 'archive_url': arch[cid]})
assert len(out) == 16 and all(r['width'] >= 1000 for r in out)
json.dump(out, open('images.json', 'w'), indent=2, ensure_ascii=False)
print('\n'.join(f"{r['id']}: {r['width']}x{r['height']} {r['asset'].rsplit('/',1)[1]}" for r in out))
