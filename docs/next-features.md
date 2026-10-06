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
| Accounts, payment, storage | **Decided Oct 6:** Apple/Google sign-in, paid subscription, personal data on the device only. Not built yet (Group B). |
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

## Group B: accounts, payment, and on-device data (decided Oct 6, 2026)

**Product owner decisions:** people sign in with **Apple or Google**, the app **takes payment**, and personal data is **stored locally on the person's device**, not on our servers.

### What this means for the architecture

| | Before | Now |
|---|---|---|
| Where birth data, journal, milestones live | Our encrypted database (build spec §3–§4) | **Only on the device**, encrypted. Our servers never receive them. |
| What our servers hold | Everything | **Only:** a sign-in identity (Apple/Google account ID, email or Apple relay email) and subscription status. |
| Charts and readings | Planned server calculation service | Already calculated on the device (prototype v0.2). No change needed. |
| App form | Web app (PWA) | **Native iOS and Android apps**, built from the existing code with Capacitor. The web version stays for demos and web sign-ups. |

Native apps are recommended because a browser can delete locally stored data (Safari does after 7 days without use unless the app is added to the home screen), and only native apps get the iOS Keychain and Android Keystore for encryption keys. Capacitor wraps the current React app, so the screens, chart engine, and tests carry over unchanged. This brings forward the PRD's "native apps" item (Group C), which is the product owner's call.

### B1. Sign in with Apple and Google
**Story:** As a user, I sign in with my Apple or Google account, with no new password.

**Scope**
- Native sign-in on each platform (Apple's and Google's own SDKs), plus web sign-in for the web version.
- Offering Google sign-in on iOS requires an equivalent privacy-focused option ([App Store Guideline 4.8](https://developer.apple.com/app-store/review/guidelines/#login-services)); Sign in with Apple meets it.
- A small auth service (recommended: Supabase Auth or Firebase Auth) verifies the identity token and stores only: provider, account ID, email (Apple's private relay address is fine), created date, subscription status.
- **Delete account inside the app** (required by Apple Guideline 5.1.1(v)): deletes the server record, revokes the Apple token, and offers to wipe on-device data.
- Sign-in is not required to try the app: onboarding and the first full reflection work signed-out (PRD: one complete introductory reflection free). Sign-in comes when the person subscribes or wants a second device.

**Acceptance:** sign in, sign out, and delete account work on iOS, Android, and web; the server record contains no birth data, journal text, or relationship details (checked by a test that inspects every API payload).

**Size:** M

### B2. Payment
**Story:** As a user, I can subscribe for ongoing chapters, my history, and follow-ups, and cancel easily.

**Scope**
- What's paid: weekly chapters after the first, full history, follow-ups and reminders, adding a relationship. **Always free:** the first full reflection, safety resources, privacy controls, export, and delete (PRD §10).
- **Store rules:** subscriptions sold inside the app must use Apple In-App Purchase and Google Play Billing, except that the US App Store now allows a link to your own web checkout ([Apple, 2025–26](https://www.iclarified.com/97192/apple-updates-app-store-rules-to-allow-external-purchase-links-in-us)) and Google allows alternative billing in the US, UK, and EEA from June 30, 2026 ([Android Developers Blog](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)).
- **Fees:** Apple takes 15% under its Small Business Program (under $1M a year) or 30% otherwise; Google takes 10% service + 5% billing on subscriptions, or 10% plus your own processor's fee with alternative billing ([Adapty](https://adapty.io/blog/google-play-billing-changes-subscriptions-fees/)).
- **Recommended:** RevenueCat to handle App Store, Google Play, and web (Stripe) subscriptions with one entitlement check. Launch with in-app purchase everywhere; add the US web-checkout link later to lower fees.
- Subscription status is cached on the device so the app works offline.
- **Guardrails (PRD §10):** price and renewal shown before purchase; cancellation explained in plain words; **no paywall or upsell right after a safety flag or inside a reflection**; paywall appears only at the start of a new chapter.

**Acceptance:** purchase, renewal, cancellation, refund, restore purchases, and an expired subscription all tested in Apple and Google sandboxes; a test confirms no paywall appears within a session that raised a safety flag.

**Size:** M–L · **Needs:** price and trial decision; Apple and Google developer accounts; business and tax details in both stores.

### B3. On-device private storage
**Scope**
- Encrypted SQLite on the device (SQLCipher), with its key in the iOS Keychain or Android Keystore. Web: IndexedDB with a non-extractable WebCrypto key, plus a clear warning that browsers can clear it.
- Same data model as build spec §4, minus server-only fields.
- **Backup is the person's choice:** "Save a backup" writes an encrypted file they keep (Files, iCloud Drive, Google Drive) and "Restore" reads it back. Nothing is backed up to us.
- Plain warning at sign-up and in Settings: if you lose your phone without a backup, your entries are gone.
- Export (readable + JSON) and delete-all already exist in the prototype; they move to the device store.

**Acceptance:** entries survive app restarts and updates; a backup made on one phone restores on another after signing in; deleting the app or choosing "Delete everything" leaves nothing readable; a test confirms the app makes no network call containing personal data.

**Size:** M

### B4. Reminders, on the device
Local notifications scheduled by the device itself (tomorrow / 3 days / a week), so no server needs to know when or why. Opt-in only; discreet text with no names. **Size:** S.

### B5. Research measures, opt-in
Pilot measures (PRD §11) need some data to leave the device. Proposed: an opt-in switch that sends only counts and enums (onboarding finished, step chosen, follow-up done, comprehension answers), never text, names, or birth data. **Size:** S–M.

### B6. Consent screens
Updated for the new model: what stays on the device, what the server holds (identity, subscription), what is sent only with consent (safety check-in, research counts), "not an emergency service", and the third-party notice when adding someone. **Size:** S.

### Conflicts this creates (decisions needed)

**1. Reviewing each reading is no longer possible.** The concierge pilot had the approver approve every reading before a participant saw it. If readings never leave the device, nobody can review them.
- **Recommended:** approve the template library up front (A1), so every reading is composed on the device from approved text. Update PRD §11 from "human-reviewed readings" to "readings composed only from human-approved templates". A1 becomes required before the pilot.
- Alternative: an opt-in "Send this reading for review" button. More work for you, and few people would use it.

**2. Safety flags can't reach the safety ops agent.** The runbook assumes flags arrive in a queue.
- **Recommended:** when the screener matches, the app still shows resources instantly, then asks "Would you like a person from Within to check in with you?". Only on "yes" does it send a minimal flag (the sentence they approve, severity, region, no birth data) to the queue. The runbook, the agent's inputs, and the drill fixtures change to match.
- Alternative: in-app resources only, with no human follow-up. Simpler and honest, but no one is ever alerted.

**3. Native apps before validation.** The PRD said no native-app commitment until usability and return use are validated. On-device storage and store payments effectively require native apps. Confirm you want to bring that forward.

---

## Group C: after the pilot (G3+), per PRD

Multiple relationships, friendships and family, progressions and Davison charts, optional end-to-end encrypted sync between devices.

---

## Recommended order

1. **A1 Template review console.** Nothing else turns draft readings into approved ones.
2. **A2 Interview mode**, so Stage 1 can start while A1 is in review.
3. **A4 Accessibility pass** (small, catches structural issues early).
4. **A3 Deeper personalization**, reviewed through A1 as it lands.
5. **B1 sign-in, B3 on-device storage, B2 payment** (in that order: storage and identity first, then the paywall on top), once the conflicts above are decided.
6. B4–B6 alongside the pilot setup.

## Decisions needed

| # | Decision | Needed for |
|---|---|---|
| 1 | Review templates in-app (A1) or in a spreadsheet? | A1 |
| 2 | Approve templates up front instead of reviewing each reading (conflict 1) | Pilot design, A1 |
| 3 | Opt-in "a person can check in" for safety flags (conflict 2) | Safety runbook, B6 |
| 4 | Build native iOS and Android apps now (conflict 3) | B1–B3 |
| 5 | Price, free trial length, monthly and/or yearly | B2 |
| 6 | Launch countries (decides store rules, fees, safety resources, privacy review) | B2, safety, B6 |
| 7 | Auth provider: Supabase Auth or Firebase Auth | B1 |
| 8 | Out-of-hours P0 coverage (runbook §3) | Safety |
| ~~—~~ | ~~Sign-in method~~ **Decided: Apple and Google** | B1 |
| ~~—~~ | ~~Reminder channel~~ **Decided by on-device storage: local notifications** | B4 |
