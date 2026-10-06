# WITHIN — Next features
Draft 0.1 · October 6, 2026 · Builds on [`build-spec.md`](build-spec.md) and [`decisions/G0-gate-record.md`](decisions/G0-gate-record.md)

## Where things stand

| Area | Status |
|---|---|
| Prototype (E1) | Live at https://praxis-mamato.github.io/within/. All PRD §4–§5 screens, nothing stored. |
| Charts | Live Western + Vedic in the browser; within 0.01° of Swiss Ephemeris on 6 reference charts. |
| Place + time zone | 49,025 towns, historical daylight saving, manual override. |
| Readings | Personalized from each chart by a draft template library (274 text fragments). **None approved yet.** |
| Safety | In-app screener, safety ops agent, runbook, drills passed twice. Region resources not written. |
| Tests | 147 passing; content lint, Swiss Ephemeris reference, drill fixtures run in CI. |

**What blocks the pilot (G2):** approved templates, region safety resources, accounts and storage, consent, privacy review, the out-of-hours decision. Features are grouped by the gate they serve.

---

## Group A: before Stage 1 interviews (G1). No backend, no stored data.

### A1. Template review console (highest priority)
**Why:** the PRD requires every interpretation to be approved by the approver. Today there are 274 draft fragments and no way to review them.

**Story:** As the approver, I can see every template with real examples of it in context, then approve, edit, or reject it, so readings move from "Draft text" to approved.

**Scope**
- A `/review` route (not linked from the participant app) listing every fragment by family: Western signs, Vedic rashis, dignities, nakshatras, dashas, transits, synastry, steps, questions, Together.
- For each fragment: the text, its ID, 3 sample readings that use it (generated from sample charts), and its lint result.
- Actions: Approve · Edit (new revision) · Reject with note. Each records approver, date, and revision.
- Decisions export as a JSON file committed to the repo (`content/approvals.json`). CI fails if a reading would use an unapproved fragment in a build marked `pilot`.
- Participant view: approved fragments drop the "Draft text" tag. Mixed readings keep it.

**Acceptance**
- All fragments reachable in ≤ 2 taps from the console home; filter by status.
- An edited fragment re-runs the content lint before it can be approved.
- Provenance on each reading shows approved revision IDs (PRD §7, §10).

**Size:** M · **Depends on:** nothing · **Owner decision:** review in-app, or as a spreadsheet export?

### A2. Interview mode
**Why:** Stage 1 needs 15–20 interviews and PRD §11 measures comprehension and lens value.

**Scope**
- Facilitator toggle (`?interview` or a hidden gesture) adds: session timer (three-minute target), a 3-question comprehension check after the first reflection ("What is this saying?", "Is this a fact or an interpretation?", "What would you do next?"), and a single-lens vs dual-lens switch so lens value can be compared (PRD §11).
- Results stay on the device and export as a short anonymized summary (no birth data, no free text) that the facilitator pastes into the study notes.
- A printed-style facilitator script in `docs/research/interview-guide.md`.

**Acceptance:** a facilitator can run a full session and leave with: time to finish, comprehension answers, lens condition, and the participant's chosen step. Nothing identifying is captured.

**Size:** S–M · **Depends on:** A1 is not required (interviews can use draft text).

### A3. Deeper personalization
**Why:** the current library uses signs; houses and lagna are calculated but unused, and milestone readings are still fixed text.

**Scope**
- Western: Moon and Venus house themes (12 each) when the birth time is exact.
- Vedic: lagna lord and its house; Moon's house from lagna.
- Milestones: personalize the Western and Vedic text from the transits and dasha on that date (the placements are already shown).
- Today: heading and question drawn from the current transit or dasha, so Today changes week to week.
- "Together" for Purpose and Relationship compares the two traditions' timing themes, not only the Moon.

**Acceptance:** every new fragment passes the content lint; 4 sample charts produce distinct text for each new slot; uncertain placements are named, never guessed.

**Size:** M · **Depends on:** A1 for approval (can be built in parallel).

### A4. Accessibility pass
**Scope:** VoiceOver (iOS) and TalkBack (Android) walkthrough of onboarding, a reflection, the timeline, and the place picker; text at 200%; reduced motion; fix findings. Add an automated axe check to CI.

**Acceptance:** no critical issues on real devices; the place picker is fully operable by keyboard and screen reader.

**Size:** S · **Depends on:** nothing.

---

## Group B: pilot build (G2). Needs separate authorization to collect data.

### B1. Accounts and private storage
**Scope:** email sign-in (magic link), encrypted storage of birth data, journal, milestones, actions (build spec §3–§4 data model), working export and hard delete, audit log for staff reads.

**Acceptance:** export contains everything entered plus each reading's provenance; delete removes it from primary storage immediately and from backups within the stated window; tested with dummy records first.

**Size:** L · **Depends on:** launch geography, privacy review (PRD §13 items 1, 3).

### B2. Reading queue (operator console)
**Why:** the pilot is concierge: the approver approves each reading before a participant sees it (build spec §3.5).

**Scope:** queue of composed readings with the chart facts beside them, separate Western and Vedic approval steps, edit-before-send, "Your reflection is being prepared" state for participants, 48-hour target with an overdue flag.

**Acceptance:** no reading reaches a participant without approval; approval time is measured (it sets pilot capacity: about 6–7 hours a week for 25 people).

**Size:** M · **Depends on:** B1, A1.

### B3. Safety operations, live
**Scope:** the screener writes flags to the queue the safety ops agent reads (runbook §6 schema); hourly agent runs; escalation notification without participant text; region resource lists for the launch region; drill on approved templates.

**Acceptance:** runbook §8 checklist complete; the out-of-hours P0 decision recorded.

**Size:** M · **Depends on:** B1, launch geography.

### B4. Follow-ups and reminders
**Scope:** real scheduled check-ins (tomorrow / 3 days / a week) by opt-in push or email; discreet copy with no names; follow-up flow as built.

**Acceptance:** permission asked only after the person opts in; turning reminders off stops them immediately.

**Size:** S–M · **Depends on:** B1.

### B5. Research instrumentation
**Scope:** the build spec §7 events (no free text, no birth data), a dashboard showing the PRD §11 thresholds with raw counts and withdrawals, and a pilot pause switch.

**Size:** S–M · **Depends on:** B1.

### B6. Consent and onboarding for real data
**Scope:** consent screens covering birth data, AI triage of safety text, "not an emergency service", withdrawal; a third-party data notice when adding someone.

**Size:** S · **Depends on:** privacy review.

---

## Group C: after the pilot (G3+), per PRD

Multiple relationships, friendships and family, progressions and Davison charts, billing (only if a commercial test is approved), native apps.

---

## Recommended order

1. **A1 Template review console.** Nothing else turns draft readings into approved ones.
2. **A2 Interview mode**, so Stage 1 can start while A1 is in review.
3. **A4 Accessibility pass** (small, catches structural issues early).
4. **A3 Deeper personalization**, reviewed through A1 as it lands.
5. Then G1 review, and Group B once the PRD §13 decisions are made.

## Decisions needed

| # | Decision | Needed for |
|---|---|---|
| 1 | Review templates in-app (A1) or in a spreadsheet? | A1 |
| 2 | Launch geography | B1, B3, privacy review |
| 3 | Email magic link, or another sign-in? | B1 |
| 4 | Hosting region and provider | B1 |
| 5 | Out-of-hours P0 coverage (runbook §3) | B3 |
| 6 | Push, email, or both for reminders | B4 |
