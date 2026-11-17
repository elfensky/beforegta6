"""Build images.json from the records below, adding size, sha256 and archive links. Run from the repo root."""
import hashlib, json, subprocess
B = ".planning/review-feedback/2026-11-17/selected-image-completion/batch-2"
C = "https://commons.wikimedia.org/wiki/"
U = "https://upload.wikimedia.org/wikipedia/commons/thumb/"
arch = {l.split("\t")[0]: l.rstrip("\n").split("\t")[2] for l in open(f"{B}/evidence/archive-results.tsv")}
R = [
 ("trump-mcdonalds", "jpg", U+"0/0f/P20251117DT-1686_President_Donald_Trump_delivers_remarks_at_the_McDonald%E2%80%99s_Impact_Summit.jpg/1280px-P20251117DT-1686_President_Donald_Trump_delivers_remarks_at_the_McDonald%E2%80%99s_Impact_Summit.jpg",
  C+"File:P20251117DT-1686_President_Donald_Trump_delivers_remarks_at_the_McDonald%E2%80%99s_Impact_Summit.jpg",
  "Public domain (US federal government work); Official White House Photo by Daniel Torok",
  "ILLUSTRATIVE, not the 2024 fry shift. Donald Trump on stage at the McDonald's Impact Summit, Westin D.C., Washington, 17 November 2025, McDonald's 'The Golden Age' backdrop. Official White House photo (Flickr 54932803153), mirrored on Commons. Replaces the saved X post image (undocumented rights). No licensed photo of the 20 October 2024 Feasterville shift was found on Commons.",
  "Colour photo; Trump, McDonald's logos and summit text clearly visible; bright blue backdrop reads well on the dark card."),
 ("beeple-nft", "jpg", U+"8/8b/Beeple%2C_Artist%2C_at_Art_Basel_Miami_Beach_2025_01.jpg/1280px-Beeple%2C_Artist%2C_at_Art_Basel_Miami_Beach_2025_01.jpg",
  C+"File:Beeple,_Artist,_at_Art_Basel_Miami_Beach_2025_01.jpg", "CC BY-SA 4.0; Jennifer 8. Lee/WikiPortraits",
  "Mike Winkelmann (Beeple) speaking at LACMA's Digital Art Conversations, Art Basel Miami Beach, 1 December 2025. Portrait of the artist, not the NFT artwork.",
  "Beeple with microphone, sharp; warm interior, good contrast on dark."),
 ("bulgaria-euro", "jpg", U+"e/e7/Welcome_to_the_euro_Bulgaria_01.jpg/1280px-Welcome_to_the_euro_Bulgaria_01.jpg",
  C+"File:Welcome_to_the_euro_Bulgaria_01.jpg", "CC BY-SA 4.0; FrDr",
  "European Commission 'Welcome to the euro, Bulgaria / 1 January 2026' banner with euro coins on the Berlaymont-area building, photographed 9 July 2025 (before changeover).",
  "Banner text '1 JANUARY 2026 WELCOME TO THE EURO, BULGARIA' legible at card width; text is a band across the middle, small but readable."),
 ("cybertruck-window", "jpg", U+"e/e9/Tesla_Cybertruck_damaged_window.jpg/1280px-Tesla_Cybertruck_damaged_window.jpg",
  C+"File:Tesla_Cybertruck_damaged_window.jpg", "CC BY-SA 4.0; u/Kruzat (Reddit)",
  "The actual event: Tesla designer Franz von Holzhausen beside the shattered Cybertruck window at the 21 November 2019 unveiling. Licence granted by the photographer on Reddit; Commons LicenseReview passed 2023-12-04 (The Squirrel Conspiracy).",
  "Shattered window clearly visible; good contrast."),
 ("department-of-war", "jpg", U+"3/32/251113-D-FN350-2324_SecDef_Pete_Hegseth_Installs_War_Department_Sign.jpg/1280px-251113-D-FN350-2324_SecDef_Pete_Hegseth_Installs_War_Department_Sign.jpg",
  C+"File:251113-D-FN350-2324_SecDef_Pete_Hegseth_Installs_War_Department_Sign.jpg",
  "Public domain (US federal government work); DoW photo by U.S. Air Force Staff Sgt. Madelyn Keech",
  "Secretary of War Pete Hegseth beside the newly installed 'Department of War' plaque at the Pentagon River Entrance, 13 November 2025 (Flickr 54921967441). Follow-on to the 5 September 2025 order, not the signing itself. Replaces the saved 'simplified logo' file (unknown author, described as unofficial).",
  "Plaque text 'DEPARTMENT OF WAR' legible; light stone facade contrasts with dark card."),
 ("four-new-elements", "png", U+"d/d6/Periodic_table_simple_en.svg/1280px-Periodic_table_simple_en.svg.png",
  C+"File:Periodic_table_simple_en.svg", "CC0; László Németh (User:Nl74)",
  "Periodic table with a completed seventh row showing Nh (113), Mc (115), Ts (117) and Og (118) with their names. Raster thumbnail of the SVG. Replaces the saved oganesson tile, whose white '118' on light grey was hard to read; the saved tile (CC BY 2.5, Albedo-ukr) remains an alternative.",
  "Opaque white background, colour blocks; symbols legible at card width, small element names readable only when enlarged."),
 ("gonorrhoea-vaccine", "jpg", U+"3/3d/Neisseria_gonorrhoeae_Bacteria_-_53136008302.jpg/1280px-Neisseria_gonorrhoeae_Bacteria_-_53136008302.jpg",
  C+"File:Neisseria_gonorrhoeae_Bacteria_-_53136008302.jpg", "CC BY 2.0; NIAID",
  "Colourised scanning electron micrograph of Neisseria gonorrhoeae diplococci, NIAID Rocky Mountain Laboratories (Flickr 53136008302). Illustrates the bacterium, not the vaccine. Replaces the saved 1973 CDC micrograph, whose three-panel disc views did not visibly show the bacterium.",
  "Purple/blue paired cocci, sharp, fills frame; reads well on dark."),
 ("ipod-discontinued", "png", U+"1/11/IPod_family.png/1280px-IPod_family.png",
  C+"File:IPod_family.png", "CC BY 3.0; Kyro (incorporates File:5th Generation iPod Touch.svg and File:7th Generation iPod Nano.svg by User:Domaina)",
  "Drawn illustration of the iPod shuffle 4G, nano 7G, classic 6G and touch 5G. Product family, not the 2022 announcement.",
  "Black backdrop; dark device bodies blend slightly into the dark card but outlines and silver devices are clear."),
 ("kilogram-redefined", "jpg", U+"f/f8/NIST-4_Kibble_balance.jpg/1280px-NIST-4_Kibble_balance.jpg",
  C+"File:NIST-4_Kibble_balance.jpg", "Public domain (US federal government work); Jennifer Lauren Lee, NIST",
  "The NIST-4 Kibble balance, used for the Planck-constant measurement behind the 2019 redefinition (photo 2015).",
  "Metallic apparatus on dark background; tall portrait framing, subject clear."),
 ("leap-second-abolished", "jpg", "https://upload.wikimedia.org/wikipedia/commons/4/43/NIST-F2_cesium_fountain_atomic_clock.jpg",
  C+"File:NIST-F2_cesium_fountain_atomic_clock.jpg", "Public domain (US federal government work); NIST Physics Laboratory, Time and Frequency Division",
  "NIST physicists Steve Jefferts and Tom Heavner with the NIST-F2 caesium fountain atomic clock (2014). Illustrative of atomic time; not the 2026 vote. Original file is 1200 px wide.",
  "Two physicists and apparatus, sharp; busy but legible."),
 ("mrna-flu-vaccine", "jpg", U+"3/3a/Influenza_virus_particle_color.jpg/1280px-Influenza_virus_particle_color.jpg",
  C+"File:Influenza_virus_particle_color.jpg", "Public domain (CDC PHIL #10073); photo credit Cynthia Goldsmith; content providers CDC/Dr. Erskine L. Palmer, Dr. M. L. Martin",
  "False-coloured TEM of an influenza virion (CDC, 1981). Illustrates the virus, not the vaccine.",
  "Purple/orange virion on blue; clear on dark."),
 ("odysseus-private-moon-landing", "jpg", U+"2/24/Intuitive_Machines%E2%80%99_Nova-C_lunar_lander_%28IM_00309%29_%28cropped%29.jpg/1280px-Intuitive_Machines%E2%80%99_Nova-C_lunar_lander_%28IM_00309%29_%28cropped%29.jpg",
  C+"File:Intuitive_Machines%E2%80%99_Nova-C_lunar_lander_(IM_00309)_(cropped).jpg", "Public domain (NASA); NASA Marshall Space Flight Center / Intuitive Machines (NASA photo ID IM_00309)",
  "The IM-1 Nova-C lander Odysseus in a hangar before launch (catalogued 7 February 2024). Not on the Moon.",
  "Lander with US flag behind, sharp; good contrast."),
 ("robot-citizen-sophia", "jpg", U+"1/1e/Sophia_at_the_AI_for_Good_Global_Summit_2018_%2827254369347%29_%28cropped%29.jpg/1280px-Sophia_at_the_AI_for_Good_Global_Summit_2018_%2827254369347%29_%28cropped%29.jpg",
  C+"File:Sophia_at_the_AI_for_Good_Global_Summit_2018_(27254369347)_(cropped).jpg", "CC BY 2.0; ITU Pictures (Flickr 27254369347)",
  "Sophia the robot at the AI for Good Global Summit, Geneva, 15 May 2018. Not the 2017 citizenship ceremony.",
  "Sophia's face clear; tall portrait framing."),
 ("storm-area-51", "jpg", "https://upload.wikimedia.org/wikipedia/commons/9/96/Crowd_gathered_at_the_back_gate_of_Area_51.jpg",
  C+"File:Crowd_gathered_at_the_back_gate_of_Area_51.jpg", "CC BY-SA 4.0; David James Henry (User:RobotGoggles)",
  "The actual event: crowd at the back gate of Area 51 on the night of the raid, September 2019. Commons date field reads 2029-09-20, an obvious typo for 2019. Original file is 1078 x 607.",
  "Night scene under floodlights; people and gate readable; modest resolution but usable."),
 ("strategic-bitcoin-reserve", "jpg", "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Executive_Order_14233.pdf/page1-1280px-Executive_Order_14233.pdf.jpg",
  C+"File:Executive_Order_14233.pdf", "Public domain (US federal government work); Executive Order 14233, Federal Register vol. 90 no. 46, 11 March 2025",
  "Crop (ffmpeg crop=850:285:390:110, no other change) of page 1 of the Federal Register printing of Executive Order 14233 of March 6, 2025, 'Establishment of the Strategic Bitcoin Reserve and United States Digital Asset Stockpile'. The actual order text. Replaces the saved Delft cafe sign (illustrative, CC BY-SA 3.0 Targaryen), which remains an alternative.",
  "Black serif text on white; heading and title legible at card width; white panel stands out on dark."),
]
out = []
for id, ext, url, page, lic, note, insp in R:
    a = f"{B}/assets/{id}.{ext}"
    w, h = (int(x.split()[-1]) for x in subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", a], capture_output=True, text=True).stdout.strip().splitlines()[1:])
    out.append({"id": id, "status": "ready", "asset": a, "image_url": url, "image_page": page, "image_license": lic, "image_note": note,
        "width": w, "height": h, "sha256": hashlib.sha256(open(a, "rb").read()).hexdigest(), "inspected": True, "inspection_note": insp,
        "source_checked_at": "2026-11-17", "archive_url": arch[id],
        "extra_archive_urls": {k: v for k, v in arch.items() if k.startswith(id + "-")}})
assert len(out) == 15 and len({r["id"] for r in out}) == 15
json.dump(out, open(f"{B}/images.json", "w"), indent=1, ensure_ascii=False)
print("\n".join(f'{r["id"]} {r["width"]}x{r["height"]} {r["sha256"][:12]}' for r in out))
