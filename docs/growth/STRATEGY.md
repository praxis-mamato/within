# Within go-to-market strategy (Nov 7, 2026)

Author: growth lead (CRO/CMO). Status: draft for Maggie's decision. Every number is tagged **[ours]** (read from our
own data on Nov 7), **[verified]** (a primary or well-sourced external fact), **[reported]** (a vendor or secondary
source) or **[assumption]** (my estimate). Section 9 lists what I could not verify and what I got wrong.

## 1. The short version

1. **We do not have a conversion problem or a product problem yet. We have a reach problem we cannot even measure.**
   After 3.5 weeks live: 1 paying member, 3 comp members, Instagram at 9 followers, about 100 reach per reel,
   and 2 website clicks from Instagram in the last 8 days **[ours]**.
2. **The daily sky-fact content is not working as a funnel and I would stop optimising it.** It is the same content every
   astrology account posts, and it never shows the one thing only we have: a personal answer from your own chart.
3. **The plan: prove one repeatable way to get a stranger to ask the Oracle a question, then pay.** Three bets, in order:
   (a) measure traffic this week, (b) put the real product in every piece of content and every outreach, (c) get
   10 small astrologers and wellness creators to try it, on a 30% affiliate share.
4. **Reset the goal.** The "10 paying by Nov 30" in `OPERATING-PLAN.md` is not supported by any funnel I can build from
   today's numbers. Honest range for Dec 12: **2 low, 4 likely, 10 stretch** paying members. See section 6.
5. **One thing to fix before we spend or promote more: a privacy claim in our own copy is more absolute than the code**
   (section 9, item A).

## 2. Who we are for (working persona: confirm or correct)

You said I know the persona; there is no persona document in the repo, so this is my read from the product, the PRD
(`docs/prd-v0.1.md`) and the sales docs.

**"The reflective question-asker."** A woman, 25–44, who already follows astrology and has tried Co-Star, The Pattern or
Chani. She comes to astrology at a decision or a transition (a relationship, a job move, a hard stretch) and wants to
know "what does *my* chart say about *this*", not "Taurus: expect a surprise". She is tired of generic horoscopes,
auto-renewing trials and apps that collect her data. A smaller second group: South Asian and yoga-community people who
already know Jyotish and want Western and Vedic side by side.

What supports it:
- 27% of US adults believe in astrology; **35% of women vs 18% of men; 43% of women aged 18–49** [verified: Pew, May 2025,
  n=9,593]. Belief is about the same among religiously affiliated and unaffiliated adults.
- The product's real difference is the answer to a specific question, with reasons and dates, from the person's own chart.
  Peers sell horoscopes, compatibility and per-minute chat [reported].
- Privacy is a real wedge: Surfshark found half of the 10 most popular US astrology apps track users and all collect
  data [reported, from App Store privacy labels, May 2025].
- The Vedic audience may be partly diaspora, not yoga-seekers: one source argues Jyotish has been less accessible to Western
  millennials than Western astrology [reported, opinion piece].

What I could not support: any figure for how many such women pay, or for Jyotish demand in the US. No data found.

**The job she hires us for:** "Tell me something true about my situation, from my chart, that I can act on this week."
**Who is not the target (for now):** people who want daily horoscopes or sign compatibility (free everywhere), and per-minute
chat buyers.

## 3. Where we are, honestly [ours, Nov 7]

| | |
|---|---|
| Paying members | 1 monthly ($9.99). Same one since Oct 14. Origin unknown |
| Comp members / codes redeemed | 3 / 3 of 52 |
| Live readings | 0 bookings, $0 |
| Instagram | 9 followers; account reach about 40–140 a day; profile views 0–4 a day; website clicks 0–1 a day |
| Reels (18) | average reach 66, best 112, saves 0, shares 1 in total |
| Feed images (18) | average reach 4, best 37 |
| Partner outreach | 64 prospects, 40 pitches drafted, **0 sent** |
| Website visitors | **unknown** (no one has shared Cloudflare or Search Console numbers) |
| Funnel events | none recorded in the last 10 days (opt-in tracking) |

What this means: Instagram reels reach about 100 strangers each, and almost none click. 166 search pages exist but we do not
know whether Google has indexed any. The product is used when people find it (about 12 people a week ask the Oracle a
question, per `OPERATING-PLAN.md` [ours, not re-verified]), so the constraint is reach.

## 4. Diagnosis: why the current approach underperforms

1. **Content is undifferentiated.** "Full Moon in Taurus tonight" is posted by every astrology account and by Co-Star. Nothing
   in it shows a personal answer, so there is no reason to click or save (0 saves across 37 posts).
2. **The account is too small for the algorithm to help.** Instagram weights watch time and sends, and sends matter more for
   non-followers [reported: SEJ, Mosseri, 2025]. Trial Reels need about 1,000 followers [reported]. At 9 followers we sit at
   about 100 reach a reel.
3. **The sales motion has not started.** Zero partner messages sent. Outreach is the only channel where one yes could
   bring hundreds of visitors.
4. **We are blind.** No visitor numbers, no Search Console. I cannot tell traffic from conversion problems.
5. **The offer ladder is untested at scale**: $9.99, $100 a year, $100 gift ($85 Black Friday through Nov 30), $350+ live. Nobody has
   told us they hesitate at any of these, because almost nobody has seen them.

## 5. The strategy: three bets, one proof point

**Proof point we need by Dec 12:** *a stranger arrives from a channel we can name, asks the Oracle a real question, and
pays.* Repeat it once from a second channel. Everything below serves that.

### Bet 1: See the funnel (week 1, $0)
- Cloudflare visits and top pages for the last 4 weeks; Google Search Console for withinoracle.app (verify the domain, submit
  the sitemap, check indexed pages). I need Maggie to share a screenshot or add a viewer.
- Put a tracking tag (`?s=ig`, `?s=reddit`, `?s=partner-<name>`) on every link we publish. The app already has a referral code
  mechanism for affiliates; I'd extend the same idea for channels. **Needs a yes: adding tracking** (PLAYBOOK rule).
- Weekly read: visitors by source, Oracle questions asked, paywall shown, checkouts started, paid.

### Bet 2: Show the product, not the sky (weeks 1–4, $0)
- Replace about two thirds of the daily sky posts with **"Ask the Oracle" content**: a real question, the Oracle's answer
  (with the reasons and dates), and the line "ask yours: link in bio". Use questions people send in comments or DMs, with
  their consent, and only Sun, Moon and rising or a sign, never birth data or names.
- Reels are our only format with reach (about 66 avg vs about 4 for images). Make fewer feed images and more reels
  built around one answer, hook in the first 3 seconds, on-screen captions [reported: Instagram guidance].
- Keep the sky calendar as a light layer for search and credibility, not the main course.
- Comments are only 0 so far: reply to every one and ask a question in the caption. Do not use "comment YES" bait
  [reported: demoted by Instagram].
- **Owner: the social manager, with my brief. Maggie approves the first week of formats.**

### Bet 3: Ten small astrologers and wellness creators (weeks 1–6, $0 plus affiliate share)
- Cut the 64 prospects to the **10 best**: small (2k–50k), US-based, active in the last 2 weeks, Western or Vedic astrologers,
  yoga or New Moon circle hosts. Write one real-detail line each.
- Offer: free membership for 30 days to try, then a 30% affiliate share on the first year (already approved, offer A). The ask is
  small: try it, tell me if it is good, use the link only if you like it.
- **Maggie sends the first messages** (Instagram does not allow bots to start conversations; the operating plan says no first DMs
  from agents). Pace: 3 a day, logged in `docs/sales/replies/sent-log.md`. Emails carry the postal address (done).
- Expected result: **unknown**. I have no reliable reply-rate data for this niche. Plan on a 10% reply rate and 1 in 5 replies
  becoming an active partner **[assumption]**: that is 10 messages to 1 reply to 0.2 partners, so I need about 30 sends for one live partner.
  That is why the send volume matters.

### What I would deliberately not do now
- **More search pages.** 166 are live and unmeasured. Google's own guidance is that new content takes hours to weeks to be
  indexed [verified: Search Engine Land quoting Google]; practitioners report new-domain batches of programmatic pages indexed
  slowly or dropped [reported, anecdotal]. First check Search Console; improve the thinnest pages; then add.
- **Scaled paid ads.** Cost per paying user on subscription apps runs about 4–5 times CPI [reported: Airbridge]. We do not
  yet know our conversion or retention, so paid is a $150 learning test, not growth.
- **Price changes.** One paying member tells us nothing. Keep $9.99 / $100. Black Friday $85 stays as planned.
- **Reddit as a promotion channel.** r/astrology's rules say no self-promotion and no full chart readings [reported, from a wiki mirror;
  I could not read r/vedicastrology or r/AskAstrologers rules]. If we use Reddit it is as a helpful member answering questions
  with no link, and only after Maggie checks each sidebar. Low priority.
- **Pinterest and TikTok as new accounts** until Bet 2 shows a format that works on Instagram.

## 6. Targets and the funnel math (reset)

Visitors needed per 10 paying members a month, at different visitor-to-paid rates **[assumption: conversion is unknown for us]**:

| Visitor → paying | Visitors needed for 10 paying |
|---|---|
| 0.5% | 2,000 |
| 1% | 1,000 |
| 2% | 500 |

Reference points: RevenueCat reports median install-to-trial about 7% in North America and health and fitness trial-to-paid
around 35–40% [reported, secondary write-ups conflict; I could not read RevenueCat's page]. Our free tier asks nothing
before the first answer, so I'd plan on **0.5–1%** of visitors until we measure.

Today's website visits are unknown; Instagram sends about 2 a week. So 10 paying members in 4 weeks would need about 100x
today's traffic. That is why I am resetting:

| By Dec 12 | Paying members | Cash (memberships) | What has to be true |
|---|---|---|---|
| Low | 2 | ~$20–110 | 3 DMs sent, 1 partner trial |
| **Likely (the target)** | **4** | **~$40–300** | Bet 2 lifts clicks to about 10 a day, 1–2 partners live, Black Friday gift or yearly sale |
| Stretch | 10 | ~$400–1,000 | One partner with a real audience, plus the $150 test works |

Cash depends on the monthly/yearly mix (yearly = $100, or $85 on Black Friday). Gifts at $100 ($85 on Black Friday) count as cash,
not members. Live readings: $0 in the likely case. One $350 reading is worth about 35 months of a $9.99 member, so a single
sale changes the month. I'd ask Maggie to price an **entry reading** (below the $350 package) as a test; that needs her yes.

## 7. 30/60/90 plan

**Next 30 days (to Dec 7)**
- Wk 1: traffic numbers (Cloudflare, Search Console); Maggie sends 3 DMs/day for 5 days; correct the privacy wording (section 9, A).
- Wk 1–2: social manager switches to Ask-the-Oracle reels; one format per week, kept or killed on reach, saves, shares and clicks.
- Wk 2–3: $150 ad test (pointed at the Nov 17 / Nov 24 moons, not Mercury, which ends Nov 13); read on day 14.
- Wk 3–4: Black Friday gift and yearly offer ($85, ends Nov 30) promoted through the partners and the feed.
- Dec 7: read the proof point; keep, kill or double each bet.

**Days 31–60 (to Jan 6):** double the channel with the lowest cost per paying member; add a second reel format; add the
baby-chart and new-year ("year ahead") gift pages if gifts sold; ask first buyers for reviews (no incentives, never for positive only).
**Days 61–90 (to Feb 5):** store apps (iPhone, Android when accounts clear), referral, partner programme at 10+ partners.

**Kill criteria (written now so I cannot rationalise later):**
- Ask-the-Oracle reels: if by Nov 28 average reach is not above 150 or clicks not above 5 a day, change the format again.
- Partners: if 30 sends (about 10 days) produce 0 replies, change the offer or channel (email vs DM), not just the wording.
- Ad test: stop at $60 spent with no checkout started.
- Any channel with 0 paying members after 6 weeks and a fair test is closed.

## 8. Risks

| Risk | Why it matters | What I'd do |
|---|---|---|
| Single paying member may be a test | Our baseline might be 0 | Maggie to confirm who it was |
| Over-claiming privacy | Core differentiator; breaches are reported in this category (Moonly, 6M users, reported by Surfshark coverage) | Fix wording first (9A) |
| Brand risk from fear or prediction content | Content lint exists; sky facts are safe | Keep the lint and the "no predictions" rule |
| Instagram policy changes or reach swings | Reported Feb 2026 reach drops; anecdotal | Do not depend on one platform; Bet 3 and search diversify |
| Founder capacity | Maggie delivers readings and sends DMs | Keep asks to 3 DMs a day; automate everything else |
| Search pages judged thin | Risk of non-indexing | Check Search Console before adding |

## 9. QA

### Checks I ran
- **Our numbers re-pulled from the database on Nov 7** (members, bookings, reviews, codes, usage events, social posts): all match this
  document. The member count has not changed since Oct 14.
- **Persona and market claims traced to source:** Pew figures from the Pew report summary (read via search results; the full PDF
  was not opened).
- **Rules checked against `PLAYBOOK.md`:** no personal network; no invented numbers or testimonials; no incentivised reviews; no fake urgency
  (Black Friday ends Nov 30 and is a real deadline); no model names in files; spending, pricing, outreach in Maggie's name and tracking
  all routed to her as yes/no; copy that I propose avoids the banned words.
- **Source quality:** searches mostly returned vendor blogs. I marked every figure that depends on one as [reported].

### Findings that change what I would do
- **A. A privacy claim is stronger than the code.** `docs/growth/launch/LAUNCH-KIT.md` (store and directory listings) and
  `PLAYBOOK.md` say the questions stay on the device. The Oracle function (`supabase/functions/oracle-answer`) shows the device sends the **question and
  calculated chart facts** (no name, no birth details) to write the answer; nothing is stored except daily counts. The site FAQ says
  servers keep only sign-in and subscription status, which is true of what is *stored*, but the question is *sent*. We should say:
  *"Your birth details and journal stay on your device. Your question and chart facts are sent to write your answer, and not stored."*
  Privacy is our wedge, so a wrong claim here is the biggest risk in this document. **I have not changed any copy; this is on the yes/no list.**
- **B. The operating plan target is not defensible.** 10 paying by Nov 30 would need about a fivefold jump in 3 weeks from a base of 1.
- **C. My own earlier advice needs correcting:** I recommended the $150 ad test point at the Mercury retrograde page (it ends Nov 13) and later
  at the Moon calendar. The right target is a page or reel that shows a personal answer; sky pages are a weak landing for a subscription.
  I also asked for 7 approvals in one list when the real issue was one: sends.

### What I could not verify (and how to close it)
| Item | Gap | To close |
|---|---|---|
| Competitor prices (Co-Star, Pattern, Sanctuary, Nebula) | Search gave conflicting or no prices | Check each app's store listing |
| Search demand ("birth chart", "mercury retrograde") | No Google Trends data reachable | Pull Google Trends in a browser |
| Co-Star and Pattern revenue and users | Estimates range from $5M to far lower | Sensor Tower or Appfigures |
| RevenueCat benchmarks | Could not open the report | Read revenuecat.com/state-of-subscription-apps |
| "56% of millennials pay for astrology" | Single blog; could not trace to the Harris Poll | Ignore until sourced |
| Meta rules for unsolicited business DMs | Search returned nothing | Read Meta's messaging policy before bulk DMs |
| r/vedicastrology, r/AskAstrologers rules | Not found | Maggie reads each sidebar |
| Our own indexing and traffic | No access | Search Console and Cloudflare |

### Sources
- Pew Research Center, "3 in 10 Americans consult astrology, tarot cards or fortune tellers", May 21, 2025: https://www.pewresearch.org/religion/2025/05/21/3-in-10-americans-consult-astrology-tarot-cards-or-fortune-tellers/
- Surfshark, astrology apps privacy research, May 20, 2025: https://surfshark.com/research/chart/astrology-apps-privacy
- Search Engine Land, how long indexing takes (Google): https://searchengineland.com/google-on-how-long-it-takes-for-seos-to-be-indexed-and-ranked-349998
- RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps-2026/ (not opened; figures via secondary summaries)
- Adapty, State of in-app subscriptions 2026: https://adapty.io/state-of-in-app-subscriptions-2026
- Airbridge on cost per paying user: https://www.airbridge.io/en/blog/how-to-track-where-paying-app-users-come-from
- Instagram research already in the repo: `docs/social/research-2026-10.md`
- r/astrology rules (wiki mirror): https://axebps-redlib.hf.space/r/beginnerastrology/wiki/rules

## 10. Decisions I need from Maggie (each one line)
1. **Yes/no:** correct the privacy wording in the site FAQ, listings and Paywall to the sentence in 9A. *Protects the core promise.* (I'd do it today.)
2. **Yes/no:** adding source tags to links (tracking). *Without it we stay blind.*
3. **Do:** send 3 DMs a day from `docs/sales/outbox/2026-11-03.md`; log them.
4. **Share:** Cloudflare and Search Console numbers; who the Oct 14 member was.
5. **Yes/no:** $150 ad test with the corrected landing page, read on day 14. $0–100 back.
6. **Yes/no:** price an entry live reading below $350 as a test. One sale is worth more than a month of memberships.
7. **Yes/no:** switch the daily social content to Ask-the-Oracle reels (social manager runs it; you approve the first week).
