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
- Yearly: Western solar return chart; Vedic varshaphal-lite (the year's dasha and Jupiter/Saturn gochara).
- Dasha calendar: the next 24 months of sub-periods.

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

### Recommendation

Do both, in this order:
1. **Route A first** for the deep natal report, Navamsa, aspect patterns, house rulers, and the monthly forecast with exact dates. This is the subscriber backbone, it works offline, and it can be approved.
2. **Route B as a subscriber feature on top** ("Go deeper with AI" and "Ask about your chart"), opt-in, grounded in Route A's text.

### Decisions needed

| # | Decision | Options |
|---|---|---|
| 1 | Use AI-written readings (Route B)? | Yes, opt-in for subscribers / Not now |
| 2 | If yes, which model? | Claude Opus 5.5 (~$1 per subscriber per month) / Claude Sonnet 5.5 (~$0.50) |
| 3 | Monthly question limit per subscriber | e.g. 20 |
| 4 | Order of Route A sections | Recommended: deep natal → Navamsa → monthly forecast → full synastry → yearly |
