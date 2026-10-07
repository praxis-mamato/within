# How Within makes readings, and what subscribers get
Draft 0.1 · October 6, 2026

## Part 1. How readings are made today

Every reading is produced **on the person's device, in about a tenth of a second, with no server and no AI**. Nothing about the person leaves the phone. There are four stages.

```
 birth date, time + precision, place         ─┐
                                               │  1. Place and time  (src/geo)
 place → latitude, longitude, time zone        │     49,025 towns (GeoNames), historical daylight-saving rules
 local time → exact UTC instant               ─┘     from the browser's time-zone database
                     │
                     ▼
 2. Sky calculation  (src/astro/chart.ts)
    Astronomy Engine (MIT, open source) gives the apparent position of the Sun, Moon, and 8 planets
    for that instant. Within's own code adds: mean lunar node, ascendant and midheaven, Placidus
    houses, Lahiri ayanamsa (Vedic), whole-sign houses, 27 nakshatras and padas, Vimshottari dashas.
    Checked against Swiss Ephemeris on 6 reference charts: worst error 30 arcseconds (0.008°).
                     │
                     ▼
 3. Chart facts  (src/astro/natal.ts)
    Both zodiacs, every placement, plus the uncertainty rules:
      exact time      → everything
      approximate     → recompute across the ± window; if the rising sign, lagna, Moon sign, or
                        nakshatra changes inside it, show both possibilities instead of picking one
      unknown time    → recompute across the whole birth day; never show a rising sign, houses,
                        or dasha dates; Vedic houses count from the Moon instead (classical practice)
                     │
                     ▼
 4. Interpretation  (src/content/*)
    Rule-based selection from written libraries. Each chart fact selects a fragment, e.g.
      Moon in Taurus (tropical)      → western.ts  PLANET_IN_SIGN.Moon.Taurus
      Moon in Meena, Revati pada 1   → vedic.ts    nakshatra symbol, deity, ruling planet, gana, yoni
      Mars in Kanya, 10th house      → dignity rule (enemy's sign) + bhava meaning (Karma bhava)
      Sun and Mercury in one rashi   → yoga rule → Budha-Aditya yoga text
    The composer fills sentences from those fragments and records which ones it used (template IDs).
```

**Where each screen's words come from**

| Screen | Source | Size today |
|---|---|---|
| Reflection (short, ~3 min) | `content/compose.ts` choosing from `templates.ts`; question and steps from `topics.ts` using the person's own answers | 274 text fragments + 20 topics |
| Full reading, Western | `content/fullReading.ts` + `western.ts`: Sun/Moon/rising, 10 planets in signs, houses, chart ruler, up to 10 aspects, element and mode balance, lunar phase, sky now | ~170 fragments |
| Full reading, Vedic | `fullReading.ts` + `vedic.ts`: lagna and its lord, Moon and nakshatra, 9 grahas with Parashari dignity and house, 12 yogas, dasha in chart context, panchang, gochara | ~140 fragments |
| Sky now / transits | Recalculated for today's date each time the screen opens | — |

**Guarantees enforced by tests (CI fails otherwise)**
- Every library string passes the content lint: no "will", "destined", "always/never", "soulmate", "they feel/want", diagnoses, scores, stay/leave advice.
- No unfilled placeholders, "undefined", or "NaN" in any reading for a set of sample charts.
- Different charts produce different readings.
- Uncertain placements are named, never guessed.
- Classical rules (dignities, yogas) are unit-tested.

**What this approach can't do**
- Text is assembled from fragments, so it can read as a list of placements rather than a story that ties them together.
- Depth grows only as fast as fragments are written and approved.
- It can't answer a person's own question in their own words.

---

## Part 2. Deeper interpretations for subscribers (spec)

### What stays free vs. what subscribers get

| Free | Subscribers ($9.99/month or $100/year) |
|---|---|
| Onboarding and the first full Self reflection | Every reflection, weekly chapters, check-ins, history |
| Chart tables (both traditions) | **Deep natal report** (below), both traditions |
| First section of the full reading (Sun, Moon, rising / lagna) | **Timing**: monthly and yearly forecasts, dasha sub-periods to the day |
| Today's Moon and the sky now headline | **Relationships**: full comparison of two charts |
| Safety resources, privacy, export, delete | **Ask about your chart** (if AI is approved, Route B) |

### Route A. Deeper rule-based library (no AI; works offline; fully approvable)

Built the same way as today: calculated facts → approved text. New calculations and sections:

**Western deep natal**
- Each planet's sign **and** house **and** its aspects read together (e.g. Venus in Libra in the 7th, square Saturn).
- House rulers: where the ruler of each house sits ("the ruler of your 7th is in your 10th": partnership tied to public life).
- Aspect patterns: stelliums, T-squares, grand trines, grand crosses, yods.
- Dominant planet and chart shape (bundle, bowl, see-saw, splay, splash).
- Part of Fortune, Chiron, Lilith (mean), the angles' rulers.
- Retrograde planets and their meaning in context.

**Vedic deep natal**
- **Navamsa (D9)**, the classical chart for relationships and inner strength: every graha's navamsa sign, vargottama planets (same sign in D1 and D9), the D9 lagna and 7th lord.
- **Dashamsa (D10)** for career.
- Strength summary per graha (dignity, house, aspects received, combustion, retrograde) in plain words. A simplified approach, not full Shadbala.
- Expanded yogas: Raja yogas (kendra–trikona lord combinations), Dhana yogas, Viparita Raja yogas, Neecha Bhanga (cancelled debilitation).
- Graha drishti (Vedic aspects, including the special aspects of Mars, Jupiter, and Saturn).
- Vimshottari to three levels (mahadasha → antardasha → pratyantardasha) with exact dates.
- Excluded by policy: Mangal dosha as a compatibility filter, and any compatibility score (PRD §2).

**Timing (both)**
- Monthly forecast: each transit to the natal chart in the coming month, **with the exact date it peaks**, plus New and Full Moons in the person's houses, retrograde stations, and eclipses.
- **Year ahead:** Jupiter, Saturn, Uranus, Neptune, and Pluto against the natal planets and angles for 12 months, each as a window (first and last day within 1°) with every exact date, including retrograde re-passes.
- **Secondary progressions** (a day for a year): progressed Sun, Moon, Mercury, Venus, Mars by sign and natal house; the progressed Moon's current sign chapter, when it began, and when it changes; the progressed lunar phase (Rudhyar's 30-year cycle) and the last progressed New Moon; progressed sign changes in the next 5 years; progressed-to-natal aspects with the month they are exact.
- **Solar arc directions:** every natal point moved by the solar arc; conjunctions, squares, and oppositions to natal points exact in the next two years.
- **Solar return:** the exact return moment, its rising sign, the Sun's and Moon's return houses, and where the return Ascendant falls in the natal chart (cast for the birthplace; relocation is a later option).
- Dasha calendar: the next 24 months of sub-periods.

**Placement tables (free, both traditions)**
- Western: every planet with sign, degree, house, motion (direct or retrograde), and essential dignity (domicile, exaltation, detriment, fall); the four angles; the 12 Placidus cusps with each house ruler and where it sits; every natal aspect with its orb.
- Vedic: lagna and each graha with rashi, degree, nakshatra and pada, nakshatra lord, bhava, navamsa sign, and dignity.

**Relationships**
- Full synastry: every planet-to-planet aspect, and house overlays (where each person's planets fall in the other's houses).
- Composite chart (midpoints) read as "the relationship itself".
- Vedic: Moon nakshatra relationship, D9 comparison, and Vedic aspects between charts, described without a score.

**Writing scale:** roughly 1,800–2,500 new fragments (e.g. 10 planets × 12 houses × 2 traditions = 240 for planets in houses alone). All need approval through the review console (A1).

**Cost:** none to run. Approval effort grows with the library.

### Route B. AI-written deep dives grounded in the calculated chart (optional, subscribers only)

The phone calculates the chart exactly as today, then sends **only the calculated facts** to a Within server function, which asks Claude to write a connected reading.

```
 device: chart facts (placements, houses, aspects, dashas, uncertainty flags)
         + the reading type ("deep natal", "this month", "us two", or the person's question)
         ── no name, birth place, journal, or relationship notes ──►
 edge function `deep-reading` (Supabase): checks subscription, rate limit
         ──► Claude API: system prompt = Within's rules + the approved library entries for exactly
             these placements (so the model elaborates approved meanings, not its own)
         ◄── structured result: sections, each tied to the facts it used
 edge function: content lint + safety screen on the output; anything failing is dropped and logged
         ──► device: shown with an "AI-written from your chart" label; stored on the device only
```

This fits PRD §7: "If AI is used, constrain it to approved evidence and content patterns."

**Rules the system prompt and the post-check enforce**
- Interpret only the facts provided; never invent placements, degrees, or dates (the check rejects any placement not in the input).
- Keep the two traditions separate and labeled; "Together" compares, never averages.
- Possibility language; no predictions of events, health, legal outcomes, infidelity, or harm; no stay/leave advice; nothing about what another person thinks or intends.
- If the person's question touches fear, coercion, or self-harm, don't interpret: show safety resources (the on-device screener runs first, so these questions shouldn't reach the server at all).

**Model and cost** (Claude API list prices, October 2026)

| | Claude Opus 5.5 (recommended for quality) | Claude Sonnet 5.5 (lower cost) |
|---|---|---|
| Price per million tokens | $4 input / $20 output | $2 input / $10 output |
| One deep reading (~4K tokens in, ~5K out incl. reasoning) | about **$0.12** | about **$0.06** |
| A subscriber's month (~8 readings: 1 natal, 4 weekly chapters, 1 monthly forecast, 2 questions) | about **$1.00** (10% of $9.99) | about **$0.50** |

Results are cached on the device, so re-opening a reading costs nothing. A per-person monthly limit (e.g. 20 questions) caps cost. Prompt caching on the fixed system prompt cuts input cost further.

**Privacy trade-off.** This is the one feature where personal data leaves the device: calculated placements (not the birth details themselves), sent per request, not stored by Within. Anthropic processes them under its API terms. It needs a clear opt-in ("Write deeper readings with AI, using your chart's placements") and a matching line in the privacy policy. People who decline keep Route A.

**Approval trade-off.** AI text can't be pre-approved word for word. Controls instead: approved library entries as the source material, the automatic content lint and safety check on every output, an "AI-written" label, a report button, and a weekly sample review by the approver.

**Size:** M (one edge function, prompt, output schema, post-checks, consent screen, device cache). Needs an Anthropic API key stored as a Supabase secret.

### Decisions (October 2026)

| # | Decision | Chosen |
|---|---|---|
| 1 | Use AI-written readings (Route B)? | **Yes, opt-in, subscribers only** |
| 2 | Model | **Claude Sonnet 5.5**: about $0.06 a reading, about $0.50 per subscriber per month |
| 3 | Monthly limit | **30 AI readings and questions** per subscriber (`AI_MONTHLY_LIMIT`, changeable without a release) |
| 4 | Order of Route A | Built together: deep natal, Navamsa and Dashamsa, monthly forecast, year ahead, progressions, solar arcs, solar return, full synastry |

### Status: built

**Route A (on the device, no AI).** Code: `app/src/astro/deep.ts` and `app/src/astro/progressions.ts` (calculations), `app/src/content/deep.ts` and `app/src/content/progressions.ts` (interpretation libraries), `app/src/content/deepReading.ts` and `app/src/content/chartReading.ts` (assembly). The full reading has four tabs:

| Tab | Free | Subscribers |
|---|---|---|
| Western | Placement tables, Sun/Moon/rising | Planets in signs and houses, aspects, planet profiles, aspect patterns, house rulers, dominant planet, the sky now |
| Vedic | Graha table, lagna | Nakshatras, grahas, yogas (incl. Raja, Dhana, Viparita, Neecha Bhanga), dashas, panchang, Navamsa, Dashamsa, graha drishti, gochara |
| Timing | — | Month ahead by date, lunations and eclipse season, stations, progressed chart, progressed contacts, solar arcs, year ahead, solar return, dasha calendar |
| Together (when their birth details are added) | — | Synastry aspects, house overlays both ways, composite chart |

All new text is in the review console (`#/review`) for approval and passes the content lint. A typical exact-time chart now produces about 60 Western items, 35 Vedic items, and 70 Timing items, plus 4 Western reference tables.

**Route B (AI, opt-in).** Code: `app/src/components/AiDeepDive.tsx`, `app/src/services/aiReading.ts` (fact sheet), `supabase/functions/deep-reading/` with `supabase/functions/_shared/deepReading.ts` (prompt, schema, checks), and the `ai_usage` table. Deployed to Supabase. To switch it on:

1. Create an API key at console.anthropic.com.
2. In Supabase, go to **Edge Functions → Secrets** and add `ANTHROPIC_API_KEY`. Optionally add `AI_MONTHLY_LIMIT` (default 30).
3. Live mode (`VITE_LIVE=true` or `?live=1`) and an active subscription are required; demo mode shows a sample result without calling the API.

### Patterns and Cycles (October 2026)

Two plain-language screens sit in front of the full reading, inspired by what makes The Pattern compelling (no jargon, synthesis instead of one paragraph per placement, timing as named periods with dates) and going further (the astrology behind every claim is one tap away, both traditions, reflection questions, nothing leaves the device).

- **Patterns** (`app/src/content/patterns.ts`, rules in `patternRules.ts`): 27 themes such as "You guard your feelings until it feels safe" or "You need room to be yourself, even in closeness". Each pattern is scored from weighted chart evidence (aspects weighted by orb, signs, houses, house emphasis, element balance, aspect figures, Vedic yogas). A chart shows its 6 to 12 strongest. Each has a summary, how it shows up, the gift, the edge, what helps, three things you might notice, a question, and the evidence list. Free: the two strongest.
- **Cycles** (`app/src/content/cycles.ts`): Jupiter-to-Pluto transits as named periods ("A season of rebuilding", "Breaking free", "Your Saturn return") with start, peak dates, end, phase (coming up, beginning, building, at its peak, integrating), intensity, how it may feel, what it touches, and what helps; plus the progressed Moon's current chapter and the current Vedic dasha period. Free: the strongest current cycle, also shown on Today.

### How a reading is made on the fly

1. **Calculate (on the phone, under 0.2 s).** Birth date, time, and place become a UTC instant (historical time zones included). Astronomy Engine gives planet positions; Within's own code adds Placidus houses, Lahiri ayanamsa, nakshatras, dashas, divisional charts, aspects, progressions, solar arcs, transits for the next year, and the solar return.
2. **Interpret (on the phone, instant).** Each calculated fact looks up its approved meaning (e.g. "progressed Moon in Libra" + "9th house"), and the sections are assembled. The same chart gives the same reading; different charts give different readings.
3. **Optional AI deep dive (server, about 20–40 s).** When the person opts in and taps "Write my deeper reading" or asks a question, the phone sends only the calculated placements and the approved text for them (no name, birth details, place, or journal). The `deep-reading` function checks the subscription and monthly limit, asks Claude Sonnet 5.5 for a structured reading, drops any section that breaks the content rules or mentions a placement not in the facts, records only a usage count, and returns the result. The phone saves it; Within's servers keep nothing.
