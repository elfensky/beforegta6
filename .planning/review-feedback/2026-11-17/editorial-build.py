"""Build editorial.json for the 2026-11-17 review feedback. Run: uv run --no-project python -I editorial-build.py
Reads notes.json and research/candidates.json read-only; asserts full coverage and valid references."""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
notes = json.loads((HERE / "notes.json").read_text())["items"]
data = json.loads((ROOT / "research/candidates.json").read_text())
cands = {c["id"]: c for c in data["candidates"]}
excluded = {e["id"] for e in data["excluded"]}
TAGS = {"politics", "economy", "tech", "internet", "science", "sport", "culture", "gaming", "gta", "creators", "world-event"}

updates, additions, outcomes = [], [], []


def out(id_, status, summary, evidence=()):
    outcomes.append({"id": id_, "status": status, "summary": summary, "evidence": list(evidence)})


def upd(id_, fields, resolution, reason, sources=()):
    updates.append({"id": id_, "fields": fields, "resolution": resolution, "reason": reason, "sources": list(sources)})


def merge(dup, into, reason, sources=()):
    upd(dup, {"status": "drop", "merged_into": into,
              "archive_reason": f"merged into {into} (review 2026-11-17): {reason}"},
        "merged-archive", reason, sources)


# --- Milestone-agent items (14): GTA stats belong to the milestone card type.
MILESTONES = ["gta5-235-million", "gta5-free-on-epic", "gta6-award", "gta6-delays", "gta5-billion-in-3-days",
              "gta6-trailer", "miami-heat-vice-city", "gta-trilogy-definitive", "gta5-ps3-x360",
              "gta5-ps5-xbox-series", "gta5-enhanced-pc", "gta5-pc", "gta5-ps4-xbox-one", "gta-online-standalone"]
for i in MILESTONES:
    out(i, "delegated-to-milestone-agent",
        "Note asks for the milestone card type; the milestone agent owns representation. No editorial field change.")

# --- Image-only notes: text stays, the image agent owns the picture.
IMAGE_ONLY = {
    "aliens": "Replace with an 'aliens' meme or a screenshot of the Grusch hearing quote.",
    "blue-texas": "Replace with a US map with Texas in blue.",
    "flying-cars": "Replace the SkyDrive photo with the Tesla Roadster prototype in flight (matches the blurb).",
    "john-cena-heel-turn": "Replace with the Cena Instagram post screenshot.",
    "new-pope": "Replace the tweet screenshot with a photo of Pope Leo XIV.",
    "real-oppressor-mk2": "Side-by-side Volonaut Airbike and Oppressor Mk II (Rockstar image allowed, AGENTS.md 2026-11-17).",
    "hulkenberg-podium": "Image of Hulkenberg and/or his F1 car; selection depends on that image.",
    "concord": "Replace the 'closed' sign with Concord game art or a screenshot.",
    "gary-grand-theft-auto": "Replace the uninspected thumbnail with a frame of Gary driving the car.",
    "ash-ketchum": "Replace with adult Ash or 'end of an era' Pokemon artwork.",
    "rdr-on-phones": "Screenshot of Red Dead Redemption running on a phone (Rockstar image allowed, AGENTS.md 2026-11-17).",
}
for i, s in IMAGE_ONLY.items():
    out(i, "delegated-to-image-agent", s + " Text unchanged.")

# --- Pure yes/ye notes: selection intent only.
SELECT = ["katy-perry-space", "trump-impeached", "black-hole-milky-way", "blessings-same-sex-couples",
          "crispr-cure-approved", "eu-roaming-free", "eu-usb-c-iphone", "falcon9-booster-landing", "ftx-collapse",
          "gulf-of-america", "harris-first-woman-vp", "heartbleed", "india-general-strike", "ingenuity-mars-flight",
          "internet-explorer-retired", "lettuce-outlasts-truss", "mexico-first-woman-president",
          "microsoft-activision", "negative-oil-price", "netflix-password-sharing", "oumuamua",
          "ozone-layer-recovery", "philae-comet-landing", "ram-shortage", "spacex-ipo", "svb-collapse",
          "tariffs-struck-down", "vw-dieselgate", "youtube-hides-dislikes", "cloned-monkeys",
          "first-millennial-saint", "ai-overviews-glue-pizza", "australia-teen-social-ban", "beatles-now-and-then",
          "brazil-blocks-x", "el-salvador-bitcoin", "flash-player-end", "gaga-copacabana", "homo-naledi",
          "k2-18b-life-hint", "last-penny"]
RELATED = {
    "black-hole-milky-way": "Related live card black-hole-image (M87, 2019); kept separate because Andrei chose both.",
    "spacex-ipo": "Same day and cause as live musk-trillionaire (12 June 2026); kept separate because Andrei chose both.",
    "tariffs-struck-down": "Pairs with live liberation-day-tariffs; distinct event.",
    "brazil-blocks-x": "Distinct from the Musk/Twitter merge (a court block, not the purchase).",
    "nvidia-record-drop": "Kept as the DeepSeek record drop; the Huang story is the separate addition nvidia-ceo-probe.",
    "ai-overviews-glue-pizza": "Kept distinct from the talking-computers merge: a separate funny incident.",
    "trump-impeached": "Existing archive_reason ('a third Trump legal card') is superseded by Andrei's yes.",
    "ram-shortage": "Distinct from chip-shortage (2025 AI memory demand vs 2020-2023 chips).",
}
for i in SELECT:
    c = cands[i]
    choice = (c.get("review_decision") or {}).get("choice")
    img = "image_url present; image agent fetches and approves the local file" if c.get("image_url") else \
        "no image; image agent must find one"
    extra = " Recorded choice was 'no', but the note says yes; the note is the intent." if choice == "no" else ""
    rel = (" " + RELATED[i]) if i in RELATED else ""
    out(i, "selected-pending-image", f"Selection intent: launch. Image work: {img}.{extra}{rel}")

# aws: yes + find an image
out("aws-outage-2025", "selected-pending-image",
    "Selection intent: launch. Image work: no image yet; image agent must find one (delegated-to-image-agent).")
out("cloudflare-outage-2025", "kept", "Already live; note 'outages funny' is approval. No change.")

# --- Edits
upd("pvz-ai-movie", {"title": "We got a Plants vs. Zombies movie before GTA 6"}, "edit",
    "Andrei's wording; the blurb still says the film is AI-made, so the card stays accurate.")
out("pvz-ai-movie", "edited", "Title changed to Andrei's wording; blurb keeps 'AI-made'.", ["fields.title"])

upd("steam-machine", {
    "title": "We got the year of the Linux desktop (almost) before GTA 6",
    "blurb": "Valve announced the Linux-based Steam Machine on 12 November 2025 and sold it from late June 2026, from $1,049. "
             "In March 2026 Linux passed 5% of Steam users for the first time.",
}, "edit", "Linux framing as requested; '(almost)' keeps the joke honest: Linux peaked at 5.33% and fell back.",
    ["https://www.gamingonlinux.com/2026/04/linux-smashes-past-5-percent-on-the-steam-survey-for-the-first-time/",
     "https://www.gematsu.com/2026/06/steam-machine-launches-june-30-starting-at-1049"])
out("steam-machine", "edited", "Linux framing; blurb adds the June 2026 launch and the 5% Steam record.",
    ["fields.title", "fields.blurb"])

upd("matpat-returns", {
    "title": "We lost and regained the Game Theory guy before GTA 6",
    "blurb": "MatPat posted 'Goodbye Internet' on 9 January 2024 and stopped hosting Game Theory on 9 March 2024. On "
             "12 November 2026 he came back with 'Hello (again) Internet' on a new channel.",
}, "edit", "Departure and return in one card. Andrei remembered 2023; the departure was 2024. He returned on a new "
           "channel, not to Game Theory.",
    ["https://en.wikipedia.org/wiki/MatPat",
     "https://www.dexerto.com/youtube/matpat-announces-surprise-youtube-return-with-brand-new-channel-3427943/",
     "https://www.youtube.com/watch?v=Zlh2gD7p5xE"])
out("matpat-returns", "edited", "Lost-and-regained title; dates verified (2024 departure, not 2023).",
    ["fields.title", "fields.blurb"])

upd("chatgpt-launch", {
    "title": "We got talking computers before GTA 6",
    "blurb": "OpenAI released ChatGPT on 30 November 2022; it reached 100 million users in two months. China's "
             "DeepSeek topped the US App Store in January 2025, and GPT-5 followed in August 2025.",
}, "merge-canonical", "Canonical for chatbot cards. Distinct incidents stay separate: glue pizza, the PvZ movie, "
                      "Will Smith spaghetti, Ghibli filter, Altman firing, Italy ban, EU AI Act. AlphaGo and AlphaFold "
                      "stay separate: games and proteins, not talking computers.",
    ["https://en.wikipedia.org/wiki/ChatGPT", "https://en.wikipedia.org/wiki/DeepSeek_(AI)",
     "https://en.wikipedia.org/wiki/GPT-5"])
merge("gpt-5", "chatgpt-launch", "talking-computers consolidation; GPT-5 is in the canonical blurb")
merge("deepseek-tops-app-store", "chatgpt-launch", "talking-computers consolidation; DeepSeek is in the canonical blurb")
out("chatgpt-launch", "merged", "Canonical 'talking computers'; gpt-5 and deepseek-tops-app-store merged in.",
    ["fields.title", "fields.blurb", "gpt-5.merged_into", "deepseek-tops-app-store.merged_into"])

upd("chandrayaan3-south-pole", {"title": "We got India on the Moon before GTA 6"}, "edit", "Andrei's wording; "
    "blurb keeps the south-pole detail.")
out("chandrayaan3-south-pole", "edited", "Title reworded.", ["fields.title"])

upd("eclipse-2024-north-america", {"title": "We got a total solar eclipse before GTA 6"}, "edit",
    "Andrei's wording; blurb still names the countries.")
out("eclipse-2024-north-america", "edited", "Title shortened.", ["fields.title"])

# Queen: approved exception replaces the coronation.
QUEEN = {
    "id": "queen-elizabeth-death", "status": "drop", "tags": ["politics", "world-event"],
    "title": "The Queen died before GTA 6",
    "blurb": "Queen Elizabeth II died at Balmoral on 8 September 2022, aged 96, after 70 years on the throne. Her son "
             "was crowned Charles III on 6 May 2023.",
    "kind": "real-event", "event_date": "2022-09-08", "post_date": None, "timeline_date": "2022-09-08",
    "fact_url": "https://en.wikipedia.org/wiki/Death_and_state_funeral_of_Elizabeth_II", "verified": True,
    "source_url": "https://www.denofgeek.com/tv/20-wild-things-we-actually-got-before-gta-6/",
    "source_platform": "other", "source_engagement": None,
    "image_url": None, "image_note": "image agent to supply; not the coronation image",
    "nsfw": False, "impact_score": 9, "meme_score": 2,
    "archive_reason": "pending image (review 2026-11-17); death-card exception approved by Andrei 2026-11-17",
}
additions.append(QUEEN)
merge("charles-coronation", "queen-elizabeth-death",
      "replaced by the Queen's death card (Andrei's exception, AGENTS.md 2026-11-17); the coronation is in its blurb")
out("charles-coronation", "merged",
    "Replaced by addition queen-elizabeth-death (status drop until image approval; selection intent launch). Parent "
    "must remove 'queen-elizabeth-death' from the excluded list. The earlier '@kirawontmiss 255K likes' figure has no "
    "URL and was not verified, so source_engagement is null and the source is the Den of Geek list.",
    ["additions.queen-elizabeth-death", "charles-coronation.merged_into"])

# Inflation: BLS CPI-U NSA, Sep 2013 = 234.149, Oct 2026 = 337.511 (latest published, released 10 Nov 2026).
CPI_START, CPI_END = 234.149, 337.511
pct = round((CPI_END / CPI_START - 1) * 100, 1)
assert pct == 44.1, pct
upd("us-inflation-peak", {
    "title": f"We got US prices up {round(pct)}% since GTA 5 before GTA 6",
    "blurb": f"US consumer prices (CPI-U) rose {pct}% from September 2013, when GTA 5 came out, to October 2026, the "
             "latest month published. The yearly rate peaked at 9.1% in June 2022.",
    "event_date": "2026-11-10", "timeline_date": "2026-11-10",
    "fact_url": "https://www.bls.gov/news.release/archives/cpi_11102026.htm",
    "source_url": "https://data.bls.gov/timeseries/CUUR0000SA0", "source_platform": "other",
}, "edit", f"Cumulative inflation from GTA 5 to the latest data: {CPI_END}/{CPI_START} - 1 = {pct}%. GTA 6 is not out, "
           "so the period ends at October 2026, the last published month. November 2026 CPI comes on 10 December "
           "2026; recompute then if wanted.",
    ["https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0?startyear=2025&endyear=2026",
     "https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0?startyear=2013&endyear=2026",
     "https://www.bls.gov/news.release/archives/cpi_11102026.htm"])
out("us-inflation-peak", "edited", f"Cumulative CPI-U Sep 2013 to Oct 2026: +{pct}%; 9.1% peak kept in the blurb.",
    ["fields.title", "fields.blurb", "fields.event_date", "fields.fact_url"])

upd("musk-buys-twitter", {
    "title": "We got Elon Musk buying Twitter and renaming it X before GTA 6",
    "blurb": "Elon Musk completed his $44 billion purchase of Twitter on 27 October 2022 and tweeted 'the bird is "
             "freed'. On 22 July 2023 he announced that Twitter would become X.",
}, "merge-canonical", "Purchase and rename in one card, as asked on both notes.",
    ["https://en.wikipedia.org/wiki/Acquisition_of_Twitter_by_Elon_Musk", "https://en.wikipedia.org/wiki/X_(social_network)"])
merge("twitter-becomes-x", "musk-buys-twitter", "same story; the rename is in the canonical title and blurb")
out("musk-buys-twitter", "merged", "Canonical; twitter-becomes-x merged in.", ["fields.title", "fields.blurb"])
out("twitter-becomes-x", "merged", "Archived into musk-buys-twitter (was still live).", ["twitter-becomes-x.merged_into"])

upd("starliner-astronauts-stuck", {
    "title": "We got Boeing's Starliner failing before GTA 6",
    "blurb": "Boeing's Starliner flew two astronauts to the ISS on 5 June 2024 for eight days. Thruster faults sent it "
             "home empty; the crew got back on 18 March 2025. NASA rated it a Type A mishap.",
}, "edit", "'Failing' is supported: NASA classified the flight a Type A mishap (report released 19 February 2026).",
    ["https://spaceflightnow.com/2026/02/19/independent-report-sharply-criticizes-nasa-management-boeing-for-troubled-starliner-flight/",
     "https://en.wikipedia.org/wiki/Boeing_Crew_Flight_Test"])
out("starliner-astronauts-stuck", "edited", "Failure headline backed by NASA's Type A mishap finding.",
    ["fields.title", "fields.blurb"])

upd("chip-shortage", {
    "blurb": "From 2020 to 2023 a worldwide chip shortage, partly caused by the COVID-19 pandemic, hit more than 169 "
             "industries and raised prices of cars, graphics cards and game consoles.",
}, "edit", "Names COVID as a cause without a COVID card: covid-pandemic is excluded under the death rule, and Andrei's "
           "exception covers only the Queen.",
    ["https://en.wikipedia.org/wiki/2020%E2%80%932023_global_chip_shortage"])
out("chip-shortage", "blocked",
    "Selection intent: launch (image_url present; image agent to approve). Blurb now names COVID. A 'We got COVID "
    "before GTA 6' card is NOT prepared: it needs Andrei's exception to the death rule (covid-pandemic is excluded "
    "for deaths). Missing: that decision only.", ["fields.blurb"])

upd("brexit-referendum", {
    "blurb": "On 23 June 2016 the United Kingdom voted to leave the European Union, 51.9% to 48.1%. It actually left at "
             "23:00 GMT on 31 January 2020, three and a half years later.",
}, "merge-canonical", "Andrei: 'there already is a brexit one'. One Brexit card with both dates.",
    ["https://en.wikipedia.org/wiki/Brexit"])
merge("uk-leaves-eu", "brexit-referendum", "duplicate Brexit card; the leaving date is in the canonical blurb")
out("uk-leaves-eu", "merged", "Archived into brexit-referendum (was live).", ["uk-leaves-eu.merged_into"])

upd("nvidia-5-trillion", {
    "blurb": "Apple became the first US company worth $1 trillion on 2 August 2018. On 29 October 2025 Nvidia became "
             "the first company worth $5 trillion, on demand for AI chips.",
}, "merge-canonical", "Answers Andrei's question: the $5 trillion card exists (live). Apple's $1 trillion moves into it.",
    ["https://www.semafor.com/article/10/29/2025/nvidia-hits-5-trillion-valuation",
     "https://thenextweb.com/news/apple-becomes-first-company-to-reach-1-trillion-market-value"])
merge("apple-trillion", "nvidia-5-trillion", "one market-value card; Apple's $1 trillion is in the canonical blurb")
out("apple-trillion", "merged", "Andrei said yes; kept as a fact in live nvidia-5-trillion instead of a second "
    "market-value card.", ["apple-trillion.merged_into", "nvidia-5-trillion.fields.blurb"])

upd("hiv-twice-a-year-jab", {
    "title": "We got a twice-a-year shot that nearly blocks HIV before GTA 6",
    "blurb": "On 18 June 2025 the US FDA approved lenacapavir (Yeztugo), an injection every six months to prevent HIV. "
             "In two large trials, 99.9% of people who got it stayed HIV-negative.",
}, "edit", "Not a vaccine: Gilead calls it injectable PrEP, a capsid inhibitor. 'Nearly blocks' matches >=99.9%.",
    ["https://www.gilead.com/news/news-details/2025/yeztugo-lenacapavir-is-now-the-first-and-only-fda-approved-hiv-prevention-option-offering-6-months-of-protection"])
out("hiv-twice-a-year-jab", "edited",
    "Stronger headline without the word vaccine. Selection intent: launch (inferred: no recorded choice; the note asks "
    "only for a better headline). Image agent to approve the existing image_url.", ["fields.title", "fields.blurb"])

NV = {
    "id": "nvidia-ceo-probe", "status": "drop", "tags": ["economy", "tech"],
    "title": "We got Nvidia's boss investigated by his own board before GTA 6",
    "blurb": "On 8 November 2026 Nvidia's board opened an inquiry into reports that CEO Jensen Huang was a foreign spy "
             "target. He admitted infidelity; the board saw no breach. Shares fell over 4% the next morning.",
    "kind": "real-event", "event_date": "2026-11-08", "post_date": None, "timeline_date": "2026-11-08",
    "fact_url": "https://www.aljazeera.com/economy/2026/11/9/nvidia-shares-slump-amid-investigation-into-ceo-jensen-huang",
    "verified": True,
    "source_url": "https://www.aljazeera.com/economy/2026/11/9/nvidia-shares-slump-amid-investigation-into-ceo-jensen-huang",
    "source_platform": "other", "source_engagement": None, "image_url": None,
    "image_note": "image agent to supply; no photo of the other person in the reports", "nsfw": False,
    "impact_score": 5, "meme_score": 2,
    "archive_reason": "pending image and a final fact check after Huang's House briefing on 18 November 2026 (review 2026-11-17)",
}
additions.append(NV)
out("nvidia-record-drop", "selected-pending-image",
    "Selection intent: launch. Image agent to approve the existing image_url. Huang request answered by addition "
    "nvidia-ceo-probe: only confirmed facts (board probe, Huang's own admission, board finding, >4% fall). The spy "
    "allegation is stated as a report; the other person is not named; no 'collapse' (fall was single-digit percent). "
    "Parent must remove or update excluded 'nvidia-huang-scandal'.",
    ["additions.nvidia-ceo-probe"])

upd("trump-kim-summit", {
    "blurb": "Donald Trump and Kim Jong Un shook hands in Singapore on 12 June 2018, the first US–North Korea summit. On "
             "30 June 2019 Trump became the first sitting US president in North Korea.",
}, "merge-canonical", "Handshake and DMZ visit in one card, as asked.",
    ["https://en.wikipedia.org/wiki/2018_North_Korea%E2%80%93United_States_Singapore_summit",
     "https://en.wikipedia.org/wiki/2019_Koreas%E2%80%93United_States_DMZ_Summit"])
merge("trump-in-north-korea", "trump-kim-summit", "same leaders; the DMZ visit is in the canonical blurb")
out("trump-in-north-korea", "merged", "Archived into live trump-kim-summit.", ["trump-in-north-korea.merged_into"])

rt = cands["bitcoin-round-trip"]
upd("bitcoin-100k", {
    "title": "We got Bitcoin at $100,000, then $126,000, then $63,000 before GTA 6",
    "blurb": "Bitcoin passed $100,000 for the first time on 4 December 2024 and hit a record of about $126,000 on 6 "
             "October 2025. In February 2026 it fell below $63,000.",
    "source_url": rt["source_url"], "source_platform": rt["source_platform"],
    "source_engagement": rt["source_engagement"],
}, "merge-canonical", "One Bitcoin cycle card. The OKX 'before GTA 6' post from bitcoin-round-trip becomes the source.",
    ["https://www.pbs.org/newshour/world/whats-next-for-bitcoin-as-it-surpasses-100000-in-post-election-rally",
     "https://fintechnews.sg/126079/crypto/bitcoin-crash-2026-analysis-strategy-kevin-warsh/",
     "https://www.theblock.co/post/390961/bitcoin-dips-below-63000"])
merge("bitcoin-round-trip", "bitcoin-100k", "one Bitcoin cycle card; the peak and fall are in the canonical")
out("bitcoin-round-trip", "merged", "Archived into live bitcoin-100k, which takes its OKX meme source.",
    ["bitcoin-round-trip.merged_into", "bitcoin-100k.fields"])

upd("change4-far-side-landing", {
    "title": "We got China on the far side of the Moon before GTA 6",
    "blurb": "China's Chang'e 4 made the first soft landing on the Moon's far side on 3 January 2019. On 25 June 2024 "
             "Chang'e 6 brought 1,935 grams of far-side soil back to Earth, the first ever.",
}, "merge-canonical", "Both far-side missions in one card; the older landing keeps the date.",
    ["https://en.wikipedia.org/wiki/Chang%27e_4", "https://en.wikipedia.org/wiki/Chang%27e_6"])
merge("change6-far-side-samples", "change4-far-side-landing", "same far-side story; the samples are in the canonical")
out("change4-far-side-landing", "merged",
    "Canonical; selection intent: launch (image agent to approve existing image_url).", ["fields.title", "fields.blurb"])
out("change6-far-side-samples", "merged", "Archived into change4-far-side-landing.", ["change6-far-side-samples.merged_into"])

upd("driverless-robotaxis", {
    "blurb": "On 8 October 2020, Waymo opened fully driverless rides, with nobody at the wheel, to riders in Phoenix.",
}, "edit", "Tesla moves to its own addition, tesla-cybercab, as asked.",
    ["https://waymo.com/blog/2020/10/waymo-is-opening-its-fully-driverless/"])
CYBER = {
    "id": "tesla-cybercab", "status": "drop", "tags": ["tech"],
    "title": "We got a Tesla designed with no steering wheel before GTA 6",
    "blurb": "Tesla unveiled the Cybercab, a robotaxi designed without a steering wheel or pedals, on 10 "
             "October 2024. Tesla said production began at Giga Texas on 22 April 2026.",
    "kind": "real-event", "event_date": "2026-04-22", "post_date": None, "timeline_date": "2026-04-22",
    "fact_url": "https://driveteslacanada.ca/news/tesla-cybercab-production-begins-but-unsupervised-fsd-remains-limited/",
    "verified": True,
    "source_url": "https://driveteslacanada.ca/news/tesla-cybercab-production-begins-but-unsupervised-fsd-remains-limited/",
    "source_platform": "other", "source_engagement": None, "image_url": None,
    "image_note": "image agent to supply", "nsfw": False, "impact_score": 4, "meme_score": 2,
    "archive_reason": "pending image (review 2026-11-17)",
}
additions.append(CYBER)
out("driverless-robotaxis", "edited",
    "Selection intent: launch (image agent to approve existing image_url). Tesla sentence removed; addition "
    "tesla-cybercab. 'Designed' is deliberate: reports say early units may have had steering wheels.",
    ["fields.blurb", "additions.tesla-cybercab"])

upd("galaxy-note-7-recall", {
    "title": "We got a Samsung phone banned from flying before GTA 6",
    "blurb": "Samsung stopped selling the Galaxy Note 7 in October 2016 because some batteries caught fire. From 15 "
             "October 2016 the US banned it from all flights to, from and within the country.",
    "event_date": "2016-10-14", "timeline_date": "2016-10-14",
    "fact_url": "https://www.transportation.gov/briefing-room/dot-bans-all-samsung-galaxy-note7-phones-airplanes",
}, "edit", "Andrei's headline, singular: only one model was banned. Date moves to the DOT order (14 October 2016).",
    ["https://www.transportation.gov/briefing-room/dot-bans-all-samsung-galaxy-note7-phones-airplanes",
     "https://www.pbs.org/newshour/politics/samsung-galaxy-note-7-phones-banned-from-airliners-over-fire-hazard"])
out("galaxy-note-7-recall", "edited", "Selection intent: launch (image agent to approve existing image_url).",
    ["fields.title", "fields.blurb", "fields.event_date"])

upd("gangnam-style-broke-youtube", {
    "title": "We got the first YouTube video with 2 billion views before GTA 6",
    "blurb": "Gangnam Style became the first YouTube video to pass two billion views at the end of May 2014. In "
             "December YouTube moved to a 64-bit view counter because the video neared 2,147,483,647 views.",
    "event_date": "2014-05-31", "timeline_date": "2014-05-31",
}, "merge-canonical", "Andrei's '2 billion' title; the counter story stays in the blurb. Crossing was late 30 May EDT "
                      "(31 May UTC).",
    ["https://www.rappler.com/entertainment/music/59336-psy-gangnam-style-youtube-record",
     "https://en.wikipedia.org/wiki/Gangnam_Style"])
merge("gangnam-style-counter", "gangnam-style-broke-youtube", "duplicate Gangnam Style card")
out("gangnam-style-broke-youtube", "merged",
    "Canonical. Selection intent: launch (inferred: no recorded choice; note gives a better title). Image agent to "
    "approve existing image_url.", ["fields.title", "fields.blurb", "fields.event_date"])
out("gangnam-style-counter", "merged", "Archived into gangnam-style-broke-youtube.",
    ["gangnam-style-counter.merged_into"])

upd("us-same-sex-marriage", {
    "blurb": "On 26 June 2015 the US Supreme Court ruled 5–4 in Obergefell v. Hodges that same-sex couples may marry "
             "in every state. A month earlier, Ireland became the first country to approve it by popular vote.",
}, "merge-canonical", "Andrei: 'there is already an item about this'. The live card absorbs Ireland.",
    ["https://en.wikipedia.org/wiki/Obergefell_v._Hodges",
     "https://en.wikipedia.org/wiki/Thirty-fourth_Amendment_of_the_Constitution_of_Ireland"])
merge("ireland-marriage-referendum", "us-same-sex-marriage", "same-sex marriage card already live; Ireland is in its blurb")
out("ireland-marriage-referendum", "merged", "Archived into live us-same-sex-marriage.",
    ["ireland-marriage-referendum.merged_into"])

upd("turkish-shooter", {"title": "We got an Olympic silver with one hand in a pocket before GTA 6"}, "edit",
    "No word that suggests violence; the blurb names Yusuf Dikeç and the sport.")
out("turkish-shooter", "edited", "Selection intent: launch (image agent to approve existing image_url).",
    ["fields.title"])

upd("trump-memecoin", {
    "title": "We got a president's meme coin losing 96% before GTA 6",
    "blurb": "Donald Trump launched the $Trump meme coin on 17 January 2025; Trump-owned companies hold 80% of the coins. "
             "By March 2026 it was about 96% below its January 2025 peak.",
}, "edit", "'Scamming' states a legal finding that no court has made. The loss is fact and carries the critical point.",
    ["https://en.wikipedia.org/wiki/$Trump",
     "https://cointelegraph.com/news/donald-trump-memecoin-holders-annual-dinner-price-low"])
out("trump-memecoin", "edited",
    "Selection intent: launch (image agent to approve existing image_url). Critical, factual headline.",
    ["fields.title", "fields.blurb"])

# --- Self-checks
note_ids = {n["id"] for n in notes}
out_ids = [o["id"] for o in outcomes]
assert len(out_ids) == len(set(out_ids)), [i for i in out_ids if out_ids.count(i) > 1]
assert note_ids <= set(out_ids), sorted(note_ids - set(out_ids))
for u in updates:
    assert u["id"] in cands, u["id"]
    into = u["fields"].get("merged_into")
    assert into is None or into in cands or into in {a["id"] for a in additions}, into
    assert not ({"review_notes", "review_decision"} & set(u["fields"])), u["id"]
up_ids = [u["id"] for u in updates]
assert len(up_ids) == len(set(up_ids)), [i for i in up_ids if up_ids.count(i) > 1]
for a in additions:
    assert a["id"] not in cands and set(a["tags"]) <= TAGS, a["id"]
for x in updates + [{"fields": a} for a in additions]:
    b = x["fields"].get("blurb")
    assert not b or len(b) <= 200, (len(b), b)

doc = {"date": "2026-11-17", "owner": "editorial agent",
       "notes": ["merged_into is a new non-public field; toCard ignores it. Parent decides whether to document it.",
                 "Additions use status drop until the image agent supplies an approved image; their selection intent "
                 "is launch.",
                 "Excluded entries to remove or update: queen-elizabeth-death, nvidia-huang-scandal."],
       "updates": updates, "additions": additions, "outcomes": outcomes}
(HERE / "editorial.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
print(len(updates), "updates,", len(additions), "additions,", len(outcomes), "outcomes; notes covered:", len(note_ids))
