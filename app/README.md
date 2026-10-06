# Within — E1 prototype

Clickable mobile web prototype for Stage 1 interviews (build spec §9, E1; authorized in `docs/decisions/G0-gate-record.md`).

**Sample data only.** Every reading is illustrative text, not a chart reading. Nothing is sent anywhere or kept after the tab closes; there is no backend and no ephemeris.

## Run it

```sh
cd app
npm install
npm run dev        # http://localhost:5173
npm test           # date precision, safety screener (incl. drill fixtures), app state rules
npm run build      # static site in app/dist, works from any path
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

## Safety behavior

Free text is screened as it's entered (`src/lib/screener.ts`). On a match the app shows the resources panel and withholds any step that involves the other person, for the rest of the session. Resource lines are placeholders until region lists are verified (runbook §8).

## Try these in an interview

- Pick "Just me for now" and confirm nothing feels missing.
- Type "He checks my phone every night." into the journal, then open the Other reflection.
- Change the birth time in Settings, then open any reflection.
