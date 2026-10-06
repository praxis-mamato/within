# Within — E1 prototype

Clickable mobile web prototype for Stage 1 interviews (build spec §9, E1; authorized in `docs/decisions/G0-gate-record.md`).

**Live charts, draft interpretations.** Birth place search and Western and Vedic placements are real and calculated in the browser. The interpretation text is draft and labeled so. Nothing is sent anywhere or kept after the tab closes; there is no backend.

## Calculations

- `src/astro/chart.ts`: planet positions from [Astronomy Engine](https://github.com/cosinekitty/astronomy) (MIT); Placidus and whole-sign houses, Lahiri ayanamsa, mean node, nakshatras, Vimshottari dashas written here.
- `src/astro/natal.ts`: applies the PRD rules for uncertain birth times. Unknown time: no rising sign, lagna, houses, or dasha dates, and the Moon is checked across the whole day. Approximate time: shows both possible signs if the window crosses a boundary.
- `src/astro/reference.swisseph.json`: six reference charts generated offline with Swiss Ephemeris (not shipped). Tests require agreement within 0.01°; the worst case is 30″.
- `src/geo/`: 49,025 towns of 5,000+ people with time zones (`npm run places` regenerates them). Historical daylight-saving rules come from the browser.

## Attribution

Place data © [GeoNames](https://www.geonames.org/) (CC BY 4.0), via all-the-cities (MIT). Time zones via city-timezones (MIT). Planet positions via Astronomy Engine (MIT).

## Run it

```sh
cd app
npm install
npm run dev        # http://localhost:5173
npm test           # chart math vs Swiss Ephemeris, places and time zones, safety screener, app state
npm run build      # static site in app/dist, works from any path
npm run build:artifact  # one self-contained file in app/dist-artifact, for the hosted preview
```

Hosted preview (private until shared): https://claude.ai/artifact/Sn9CXDfgYTVTtM5Sh4J8QE

```sh
# republish after changes: npm run build:artifact, then publish dist-artifact/within-prototype.html again
```

## What's in it

| Area | Screens |
|---|---|
| Onboarding | All 8 PRD §4 steps: focus, outcome, limits, birth details with exact/approximate/unknown time, self-only or one person, first reflection, choice, optional reminder |
| Today | Purpose, one reflection, next step, check-ins for earlier steps, explicit "done for today" |
| Reflection | Situation (editable) → purpose → Western and Vedic cards (order randomized per session) → Together → question → step / pause / nothing → follow-up time. "Not included" notes, details with method version, "This doesn't fit" feedback, out-of-date banner |
| Relationships | "You" space (Self, Purpose) and one relationship with Self · Other · Relationship · Purpose. Timeline over the Rendering B landscape, with exact/approximate/range markers; add, edit, correct, exclude, delete milestones; archive or delete the relationship |
| My Growth | Purpose and its history, steps and pauses, changes I've noticed, private journal; follow-up flow (tried / didn't / paused → helpful / neutral / unhelpful → notes → next) |
| Settings | Method explanations, birth details (editing marks reflections out of date), discreet notifications, export (JSON), delete, safety resources |

## Template review (#/review)

The approver's console for every interpretation fragment (next-features A1). It isn't linked from the app; open `#/review` on any build.

- Fragments are listed by library and group (`src/content/registry.ts`), each with the content lint result and sample readings from 37 sample charts that use it.
- Approve, edit (the new wording must pass the lint), or reject with a note. Each decision records approver, date, revision, and a hash of the text it was made on; if the library text changes later, the fragment shows as "changed" and needs review again.
- Decisions are kept on the device until exported. Commit the exported file as `src/content/approvals.json`; approved edits then replace the library text in readings.
- `npm run test:pilot` fails unless every fragment is approved, for gating a pilot build.

## Safety behavior

Free text is screened as it's entered (`src/lib/screener.ts`). On a match the app shows the resources panel and withholds any step that involves the other person, for the rest of the session. Resource lines are placeholders until region lists are verified (runbook §8).

## Try these in an interview

- Pick "Just me for now" and confirm nothing feels missing.
- Type "He checks my phone every night." into the journal, then open the Other reflection.
- Change the birth time in Settings, then open any reflection.
