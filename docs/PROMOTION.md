# Promotion push: launch week 2026

- Status: adopted by Andrei on 2026-11-15, with his answers in § Answers. Council record:
  `superpowers/specs/2026-11-15-promotion-council.md`.
- Window: Sunday 2026-11-15 to Sunday 2026-11-22. GTA 6 launches on Thursday 2026-11-19 (Take-Two Q2 FY27 earnings, 9 Nov 2026).
- Budget: 1 to 2 hours a day, finished before 23:00 CET.

## Start condition and urgency — confirmed 2026-11-17

The local Yes/No tool and manual sort are complete.
Finish the remaining image work, then update and verify staging and production with the reviewed selection.
**Create and publish social-media posts immediately after production verification, as soon as possible.** Drafts alone do not complete this goal.

This production-first order supersedes missed dates in the original schedule below.
Refresh draft counts, dates, examples, and card links against the deployed site before posting.
Keep the agreed channel limits and stop rules. Recheck current platform and community rules before each post.
Record each published post's URL, channel, and time so completion can be verified.

## The idea in one line

The meme stops working on Thursday. beforegta6.wtf is its archive, and the only finished one: the three competing
sites are a placeholder, an empty board and an unfinished quiz (checked 2026-11-15). Every post sells that angle.

## Before the first link post

1. **Cache the HTML at the edge.** Verified on 2026-11-16: two production requests returned `cf-cache-status: HIT`.
   The apex cache rule and Tiered Cache are active. Configuration: `deploy/README.md` § One-time setup, step 8.
2. **Check the Reddit account.** Open its profile while logged out. If the profile or a recent post is invisible, the
   account is shadowbanned: stop and use the press and X channels only. r/gaming allows self-promotion in at most 10 %
   of an account's submissions.
3. **Release the completed selection** to staging and production after the image follow-up. Verify both environments and the production card links before posting.

## Original schedule (CET)

Order of value. The production-first start condition above takes priority over missed dates; no post is recorded as published without evidence.

| When | Where | What |
|---|---|---|
| Sun 15, 19:00 | r/SideProject | Link post, draft 1 |
| Sun 15, 20:00 | X | 3 to 5 replies with card links, draft 6 |
| Mon 16, 16:00 | r/gaming | Link post, draft 2 |
| Tue 17, 15:00 | Email | Press note, draft 7, to the writers who covered the meme |
| Tue 17, 20:00 | X | 3 to 5 replies with card links |
| Wed 18, 18:00 | r/GTA6 | One original meme image, no link, no site name (§ Memes) |
| Wed 18, 20:00 | X | Launch-eve post, draft 5 |
| Thu 19, all day | X | Replies to launch-day posts with card links |
| Thu 19, 15:00 | Hacker News | Normal submission, draft 8. Not a Show HN |
| Fri 20, 19:00 | r/belgium **or** r/astrojs | Optional link post, draft 4 or 4b. One of the two only |
| Sat 21, 15:00 | r/webdev | Showoff Saturday post, draft 3 |
| Sun 22, evening | Umami | Read referrers per channel, stop |

At most 4 Reddit link posts in the week. Never post the same title twice. Reddit counts "mass-posting repetitive
content for the purpose of exposure" as spam (Reddit Help, "Spam").

### Places that are closed

Do not post the link in these subs: r/GTA6 (all off-site links blocked, self-promotion only with mod approval), r/GTA
("under no circumstances"), r/GTAV, r/GrandTheftAutoV, r/gtaonline, r/rockstar, r/GamingCirclejerk, r/memes,
r/dankmemes, r/me_irl, r/wholesomememes. r/XboxSeriesX needs mod consent. r/videogames allows it only in its Weekly
Showcase thread. r/InternetIsBeautiful bans "aggregates" and "collections", which this site is.

## Stop rules

- A link post that shows 0 visits from its referrer in Umami 1 hour after posting is removed or filtered. Make no other
  Reddit link post that day.
- A mod removal in r/gaming: never post the link there again.
- A comment asks for something the site does not do (submissions, votes): answer it, and do not promise a feature.

## Drafts

Rewrite each draft in your own words before you post. r/webdev removes posts that read as LLM-generated.

**1. r/SideProject**

> Title: I made a timeline of everything we got before GTA 6 (97 events, 2013 to Thursday)
>
> GTA V came out in September 2013. GTA 6 comes out on the 19th. That's 4,811 days, and in between we got a new pope,
> flying cars, Brexit, ChatGPT and a photo of a black hole.
>
> beforegta6.wtf puts 97 of those on one timeline. Each card has the meme line, one line of fact and a link to the
> original post. It's a static Astro site, no sign-up. The header counts down and flips on launch night.
>
> I only kept events that hit a lot of people, so "GTA 6 before milk expiring" didn't make it. What did I miss?

**2. r/gaming** (link post, the site is the original source)

> Title: We got 97 things before GTA 6, so I put every one of them on a timeline

**3. r/webdev, Showoff Saturday**

> Title: Showoff Saturday: a static timeline of everything we got before GTA 6
>
> Astro 7, static output, one Markdown file per card. astro:assets turns the images into WebP. Every card gets its own
> page and its own Open Graph image, so a shared card shows that meme. It runs in nginx on a small Docker Swarm behind a
> Cloudflare Tunnel, with self-hosted Umami. Happy to answer questions about the build.

**4. r/belgium**

> Title: Made a site while waiting for GTA 6: everything that happened since 2013

**4b. r/astrojs**

> Title: Built a meme timeline with content collections: 97 cards, a page and an OG image per card

**5. Launch-eve post (X)**

> GTA 6 is out tomorrow. Since GTA V we got a new pope, flying cars, Brexit, ChatGPT and 93 more things. All of them,
> with sources: beforegta6.wtf

**6. X replies** (only under a post whose event has a card; vary the first line, never paste the same text twice)

> it's on the list: beforegta6.wtf/new-pope/

The card URL previews that card's meme. Check the card exists before you reply.

**7. Press note**

> Subject: The "before GTA 6" meme ends Thursday. Here's the full archive
>
> Hi (name),
>
> You wrote about the "we got X before GTA 6" meme in (article). On Thursday it stops working, so I archived it:
> beforegta6.wtf has 97 events from the GTA V release to launch day, each with the original meme post and a source.
> Every card has its own link and preview image, so you can link a single one. No sign-up.
>
> It's a hobby project from Belgium. Happy to answer questions.
>
> Andrei Lavrenov

Writers who covered the meme (2026-11-15 web search): Den of Geek ("20 Wild Things We Actually Got Before GTA 6"),
Daily Dot, BroBible, Sportskeeda, GTA Intel ("The Meme That Became a Unit of Time"), Know Your Meme ("We Got X Before
GTA 6"). Find each author's contact on the article page. Send one email per writer, not a group mail.

**8. Hacker News** (normal submission)

> Title: Everything we got before GTA 6

Show HN does not fit: its rules list "lists" as off topic, because a list "can't be tried out" (news.ycombinator.com/showhn.html).

## Memes

A no-link meme brings little direct traffic: r/GTA6 blocks the link, and a site name in the image counts as
self-promotion. Make one only when there is time. It must be original, with no Rockstar art.

- Idea: a shop receipt, "GTA 6 / waited 4,811 days", with the events as line items and a total.
- Idea for launch day: "We got GTA 6 before ___" (the meme is already inverting: "before milk expiring", 32K votes on
  r/GTA6, and "before Winds of Winter", 18K on r/NonPoliticalTwitter).

## Answers (Andrei, 2026-11-15)

- Reddit account: old, active, little self-promotion. The r/gaming post goes ahead.
- X: a personal account with followers. Hacker News: an account. No Bluesky, no short video.

## Site changes

| Change | State |
|---|---|
| Cloudflare Cache Rule for HTML | Active; two production responses returned `HIT` on 2026-11-16 |
| A share button on each card page: share sheet, else copy link | Production serves the markup and script, verified 2026-11-16 |
| After launch, "And we got GTA 6 before The Winds of Winter." under the title | Production serves the markup and countdown script; the calendar check remains scheduled for 2026-11-19 |
| Homepage OG image as a grid of card images | Not chosen |
