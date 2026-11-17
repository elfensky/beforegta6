# Build images.json from hand-checked records; measure each asset (decode, size, sha256).
import hashlib, json, sys
from PIL import Image
B = ".planning/review-feedback/2026-11-17/selected-image-completion/batch-1"
C = "https://commons.wikimedia.org/wiki/File:"
U = "https://upload.wikimedia.org/wikipedia/commons/"
arch = dict(l.rstrip("\n").split("\t") for l in open(f"{B}/evidence/archive-log.tsv"))
R = [
 ("log4shell","log4shell.jpg",U+"thumb/d/d4/Apache_Log4j_Logo.svg/1280px-Apache_Log4j_Logo.svg.png",C+"Apache_Log4j_Logo.svg",
  "Logo of the Apache Software Foundation, released under the Apache License 2.0 (Apache Software Foundation); SVG redraw by Jim McKeeth dedicated CC0. Log4j is an ASF trademark.",
  "The Apache Log4j logo (the library with the Log4Shell flaw). Commons PNG render of the SVG, flattened from transparent onto white with macOS sips so the black wordmark stays legible on the dark card.",
  "Viewed: LOG4J wordmark and red logo on white; corner pixels checked as pure white after flattening; legible on a dark background."),
 ("mrbeast-500-million","mrbeast-500-million.jpg",U+"thumb/0/0a/MrBeast_2022_01.jpg/1280px-MrBeast_2022_01.jpg",C+"MrBeast_2022_01.jpg",
  "CC BY 3.0 (Fidias). Source video 'How I Won A Lamborghini From MrBeast' (YouTube W2afl71B7t8, channel Fidias, 15 April 2022) shows 'Creative Commons Attribution license (reuse allowed)', checked 2026-11-17; Commons licence review was still pending.",
  "Frame of MrBeast from Fidias's CC BY YouTube video, April 2022. Not an image of the 500-million milestone.",
  "Viewed: MrBeast in front of a YouTube 'Subscribe' banner; sharp 1280x720 frame."),
 ("negative-rates-ecb","negative-rates-ecb.jpg",U+"thumb/7/75/Europ%C3%A4ische_Zentralbank_Frankfurt.jpg/1280px-Europ%C3%A4ische_Zentralbank_Frankfurt.jpg",C+"Europ%C3%A4ische_Zentralbank_Frankfurt.jpg",
  "CC BY-SA 3.0 de (Thomas Wolf, www.foto-tw.de)",
  "European Central Bank headquarters, Frankfurt, photographed 10 July 2019. Illustrates the institution; not a 2014 event photo.",
  "Viewed: ECB glass tower against blue sky; clear, well exposed."),
 ("net-neutrality-repeal","net-neutrality-repeal.jpg",U+"thumb/8/81/Day_of_Action_to_Save_Net_Neutrality_01.jpg/1280px-Day_of_Action_to_Save_Net_Neutrality_01.jpg",C+"Day_of_Action_to_Save_Net_Neutrality_01.jpg",
  "Public domain (PD-text and PD-shape on Commons); banner by Fight for the Future",
  "Fight for the Future 'Sorry, we're stuck in the slow lane' banner from the 12 July 2017 Day of Action to Save Net Neutrality, before the December 2017 FCC vote.",
  "Viewed: blue-purple text 'Sorry, we're stuck in the slow lane.' on a dark navy panel; text legible; image edge is dark, so the card border should separate it from the page."),
 ("neuralink-first-human","neuralink-first-human.jpg",U+"thumb/0/0c/Elon_Musk_and_the_Neuralink_Future.jpg/1280px-Elon_Musk_and_the_Neuralink_Future.jpg",C+"Elon_Musk_and_the_Neuralink_Future.jpg",
  "CC BY 2.0 (Steve Jurvetson)",
  "Elon Musk beside the Neuralink surgical robot at the Neuralink update event, 28 August 2020. Not the January 2024 first human implant.",
  "Viewed: Musk on stage beside the white Neuralink robot before a blue curtain; clear."),
 ("neutron-star-gold","neutron-star-gold.jpg",U+"thumb/6/68/Eso1733q_Artist%E2%80%99s_impression_of_merging_neutron_stars.jpg/1280px-Eso1733q_Artist%E2%80%99s_impression_of_merging_neutron_stars.jpg",C+"Eso1733q_Artist%E2%80%99s_impression_of_merging_neutron_stars.jpg",
  "CC BY 4.0 (ESO/L. Calçada/M. Kornmesser)",
  "ESO artist's impression (eso1733q) of two neutron stars about to merge. An illustration, not an observation of GW170817.",
  "Viewed: two bright stars in a blue ripple field on black; reads well on a dark card though the top edge is dark."),
 ("pig-kidney-271-days","pig-kidney-271-days.jpg",U+"thumb/2/2f/Pig_%28Sus_scrofa_domesticus%29_-_FrogHollow_Farm_Sanctuary_2019-10-26_%2802%29.jpg/1280px-Pig_%28Sus_scrofa_domesticus%29_-_FrogHollow_Farm_Sanctuary_2019-10-26_%2802%29.jpg",C+"Pig_(Sus_scrofa_domesticus)_-_FrogHollow_Farm_Sanctuary_2019-10-26_(02).jpg",
  "CC BY-SA 4.0 (Ryan Hodnett)",
  "Illustrative only: a domestic pig at FrogHollow Farm Sanctuary, Ontario, 26 October 2019. Not a gene-edited donor pig and unrelated to Tim Andrews's transplant.",
  "Viewed: ginger pig in profile behind a wire fence; clear and bright."),
 ("saudi-women-drive","saudi-women-drive.png",U+"thumb/0/0d/Flag_of_Saudi_Arabia.svg/1280px-Flag_of_Saudi_Arabia.svg.png",C+"Flag_of_Saudi_Arabia.svg",
  "Public domain (national flag; Commons insignia restriction applies)",
  "Flag of Saudi Arabia, illustrative. Alternatives checked: no licensed photo of women driving in Saudi Arabia found on Commons; the Women2drive logo (File:WOMEN2DRIVE_logo.png) has an unverified own-work claim by an account named after the campaign while its description credits designer Mohammed Sharaf, so it was rejected; the Latuff cartoon was not used.",
  "Viewed: green flag with white shahada and sword, opaque; legible on a dark card. The shahada is religious text; avoid cropping or overlaying it."),
 ("scotland-referendum","scotland-referendum.jpg",U+"thumb/3/3a/Scottish_IndyRef_2014_12.jpg/1280px-Scottish_IndyRef_2014_12.jpg",C+"Scottish_IndyRef_2014_12.jpg",
  "CC BY-SA 3.0 (Brian McNeil)",
  "Tenement block in Leith, Edinburgh, with both Yes and No referendum posters and a Union flag in its windows, photographed 18 September 2014 (referendum day). Replaces the plain Scottish flag.",
  "Viewed: sandstone tenement with Yes and No window posters and a Union flag; posters readable at card size."),
 ("skype-shutdown","skype-shutdown.png",U+"4/4b/Skype_Logo.png",C+"Skype_Logo.png",
  "Public domain (PD-textlogo on Commons); Skype trademark of Microsoft",
  "The Skype cloud wordmark logo (pre-2017 design), original 772x341 PNG.",
  "Viewed: white 'skype' text on a blue cloud with transparent surround; legible on a dark card. Smaller than 1280 wide but sharp."),
 ("uk-age-checks","uk-age-checks.jpg",U+"thumb/d/da/Online_Safety_Act_2023_%28UKPGA_2023-50_kp%29.pdf/page1-960px-Online_Safety_Act_2023_%28UKPGA_2023-50_kp%29.pdf.jpg",C+"Online_Safety_Act_2023_(UKPGA_2023-50_kp).pdf",
  "Open Government Licence v3.0 (Parliament of the United Kingdom; contains public sector information licensed under the OGL v3.0). Royal arms on the page is a Crown insignia, reproduced as part of the document.",
  "Title page of the Online Safety Act 2023 (chapter 50), the law under which the age checks were introduced; page 1 render of the official PDF from legislation.gov.uk. Not an age-check screen.",
  "Viewed: white page with royal arms and 'Online Safety Act 2023 / CHAPTER 50'; title legible; portrait, mostly white space."),
 ("vine-shutdown","vine-shutdown.png",U+"thumb/e/e0/Vine_logo.svg/1280px-Vine_logo.svg.png",C+"Vine_logo.svg",
  "Public domain (PD-textlogo on Commons); Vine trademark",
  "The Vine app icon (teal rounded square with white 'V').",
  "Viewed: teal-to-dark gradient icon, opaque except rounded corners; legible on dark."),
 ("windows-xp-end-of-support","windows-xp-end-of-support.jpg",U+"thumb/5/57/Windows_XP_sighted_%27in_the_wild%27_on_a_cash_point%2C_3_August_2018.jpg/1280px-Windows_XP_sighted_%27in_the_wild%27_on_a_cash_point%2C_3_August_2018.jpg",C+"Windows_XP_sighted_%27in_the_wild%27_on_a_cash_point,_3_August_2018.jpg",
  "CC BY-SA 4.0 (BrayLockBoy)",
  "An NCR cash machine in Slough showing the Windows XP Professional 'Windows is shutting down' screen, 3 August 2018, four years after support ended.",
  "Viewed: NCR ATM screen with the Windows XP shutdown dialog visible; small but recognisable at card size."),
 ("woolly-mice","woolly-mice.jpg",U+"thumb/3/37/Woolly_mammoths_by_Knight.jpg/1280px-Woolly_mammoths_by_Knight.jpg",C+"Woolly_mammoths_by_Knight.jpg",
  "Public domain (Charles R. Knight painting, ca. 1929). The file's embedded EXIF says '© The Field Museum'; a faithful photo of a public-domain 2D work adds no US copyright.",
  "Illustrative only: Charles R. Knight's painting of woolly mammoths. Not the Colossal mice; no licensed photo of them was found.",
  "Viewed: mammoth herd in snow, wide 1280x448 panorama; card crop will cut the sides."),
 ("zealandia-continent","zealandia-continent.jpg",U+"thumb/7/7f/Zealandia_topography.jpg/1280px-Zealandia_topography.jpg",C+"Zealandia_topography.jpg",
  "Public domain (NOAA National Geophysical Data Center, ETOPO2v2; US federal work)",
  "Topographic map of Zealandia with its outline drawn around New Zealand and New Caledonia.",
  "Viewed: blue relief map with pink outline of Zealandia; outline visible. Portrait 1280x1488."),
]
out = []
for id_, f, url, page, lic, note, insp in R:
    p = f"{B}/assets/{f}"
    with Image.open(p) as im:
        im.load(); w, h = im.size
    out.append(dict(id=id_, status="ready", asset=p, image_url=url, image_page=page, image_license=lic,
        image_note=note, width=w, height=h, sha256=hashlib.sha256(open(p,"rb").read()).hexdigest(),
        inspected=True, inspection_note=insp, source_checked_at="2026-11-17",
        archive_url=arch.get(page.replace("(", "(").strip(), "").strip() or None))
ids = json.load(open(".planning/review-feedback/2026-11-17/selected-image-completion/batch-1-input.json"))["ids"]
assert [r["id"] for r in out] == ids or sorted(r["id"] for r in out) == sorted(ids), "id mismatch"
json.dump(out, open(f"{B}/images.json","w"), indent=1, ensure_ascii=False)
for r in out: print(r["id"], r["width"], r["height"], r["archive_url"])
