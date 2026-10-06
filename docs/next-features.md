# WITHIN — Next features
Draft 0.1 · October 6, 2026 · Builds on [`build-spec.md`](build-spec.md) and [`decisions/G0-gate-record.md`](decisions/G0-gate-record.md)

## Where things stand

| Area | Status |
|---|---|
| Prototype (E1) | Live at https://praxis-mamato.github.io/within/. All PRD §4–§5 screens, nothing stored. |
| Charts | Live Western + Vedic in the browser; within 0.01° of Swiss Ephemeris on 6 reference charts. |
| Place + time zone | 49,025 towns, historical daylight saving, manual override. |
| Readings | Short reflections personalized from each chart, plus a **full reading** per tradition (6 Western and 7 Vedic sections: planets in signs and houses, chart ruler, aspects, temperament, lunar phase, dignities, nakshatra details, yogas, dashas, panchang, and the sky now). Draft libraries, **none approved yet**. |
| Prompts | Tap-to-fill options on every text field; "What's happening?" covers yourself, the sky now, people around you, and relationships. Step 7 is built from the person's own answers. |
| Safety | In-app screener, safety ops agent, runbook, drills passed twice. Region resources not written. |
| Accounts, payment, storage | **Built for web (Oct 6):** Apple/Google sign-in with email-link second step, Stripe web checkout ($9.99/month, $100/year), encrypted on-device storage. Runs in demo mode until the keys in `docs/setup/accounts-and-payments.md` are added. Native apps and in-app purchase not built yet. |
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
- **Email link as the second factor (decided Oct 6).** After Apple or Google sign-in, a one-time link sent to the account's email confirms it's really you. Asked for: first sign-in on a new device, restoring a backup, changing the subscription, and deleting the account. Apple's private relay addresses receive these links normally. Links expire after 15 minutes, work once, and contain no personal details. The email says only "Your Within sign-in link".
- **Delete account inside the app** (required by Apple Guideline 5.1.1(v)): deletes the server record, revokes the Apple token, and offers to wipe on-device data.
- Sign-in is not required to try the app: onboarding and the first full reflection work signed-out (PRD: one complete introductory reflection free). Sign-in comes when the person subscribes or wants a second device.

**Acceptance:** sign in, sign out, and delete account work on iOS, Android, and web; a new device can't open the account or restore a backup until the email link is used; an expired or reused link is refused; the server record contains no birth data, journal text, or relationship details (checked by a test that inspects every API payload).

**Size:** M

### B2. Payment
**Story:** As a user, I can subscribe for ongoing chapters, my history, and follow-ups, and cancel easily.

**Scope**
- What's paid: weekly chapters after the first, full history, follow-ups and reminders, adding a relationship. **Always free:** the first full reflection, safety resources, privacy controls, export, and delete (PRD §10).
- **Store rules:** subscriptions sold inside the app must use Apple In-App Purchase and Google Play Billing, except that the US App Store now allows a link to your own web checkout ([Apple, 2025–26](https://www.iclarified.com/97192/apple-updates-app-store-rules-to-allow-external-purchase-links-in-us)) and Google allows alternative billing in the US, UK, and EEA from June 30, 2026 ([Android Developers Blog](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)).
- **Fees:** Apple takes 15% under its Small Business Program (under $1M a year) or 30% otherwise; Google takes 10% service + 5% billing on subscriptions, or 10% plus your own processor's fee with alternative billing ([Adapty](https://adapty.io/blog/google-play-billing-changes-subscriptions-fees/)).
- **Price (decided):** $9.99 a month or $100 a year, in every store and on the web; Apple and Google set local prices per country.
- **Recommended:** RevenueCat to handle App Store, Google Play, and web (Stripe) subscriptions with one entitlement check. Launch with in-app purchase everywhere; add the US web-checkout link later to lower fees.
- Subscription status is cached on the device so the app works offline.
- **Guardrails (PRD §10):** price and renewal shown before purchase; cancellation explained in plain words; **no paywall or upsell right after a safety flag or inside a reflection**; paywall appears only at the start of a new chapter.

**Acceptance:** purchase, renewal, cancellation, refund, restore purchases, and an expired subscription all tested in Apple and Google sandboxes; a test confirms no paywall appears within a session that raised a safety flag.

**Size:** M–L · **Needs:** Apple Developer Program and Google Play Console accounts in the business's name; bank and tax details in both stores; a RevenueCat account.

### B3. On-device private storage
**Scope**
- Encrypted SQLite on the device (SQLCipher), with its key in the iOS Keychain or Android Keystore. Web: IndexedDB with a non-extractable WebCrypto key, plus a clear warning that browsers can clear it.
- Same data model as build spec §4, minus server-only fields.
- **Sync and backup through the person's own cloud (decided):** CloudKit private database on Apple devices, the Google Drive app-data folder on Android and web, encrypted on the device before upload. Plus "Save a backup file" for moving between iPhone and Android. Nothing is backed up to us.
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

### Where people's data lives (decided Oct 6: host as little as possible)

People's entries live **on their phone**, and copies go to **their own cloud account**, not ours. Apple and Google store it, it counts against the person's own storage, and we can't read it.

| Data | Where it lives | Who pays to store it | Can we read it? |
|---|---|---|---|
| Birth details, journal, milestones, steps, readings | On the device, encrypted | Nobody (the person's phone) | No |
| Sync and backup between their own devices | iPhone/iPad: Apple **CloudKit private database** (inside their iCloud). Android and web: a hidden **Google Drive app folder** in their Drive. Both encrypted before upload. | The person's own iCloud or Google storage | No |
| Moving between iPhone and Android | An encrypted backup file they save and open on the new phone | Nobody | No |
| Account (who signed in) | Small auth service (Supabase or Firebase) | Us: a few hundred bytes per person | Only the sign-in identity |
| Subscription status | RevenueCat (and Apple/Google) | Included in RevenueCat's pricing | Only payment status |
| Safety check-in requests (opt-in only) | A small queue in the same auth service | Us: a few hundred bytes per request | Only what the person chose to send |

**What we host in total:** sign-in records, subscription status, and the occasional safety check-in, which is a few hundred bytes per person, kilobytes per thousand people. No birth data, journals, or readings ever reach our servers. Readings are calculated on the phone, so there is no calculation server either.

**Trade-offs, stated plainly to users:**
- If someone turns off iCloud or Google backup and loses their phone, their entries are gone. Settings shows whether backup is on.
- Their data travels with their Apple or Google account, not their Within account. Signing into Within on a phone with a different Apple/Google account starts fresh (the email-link check still applies).

### Decisions recorded (Oct 6, 2026)

| # | Decision | What changes |
|---|---|---|
| 1 | **Approve the template library up front**; no per-reading review | A1 (review console) is required before launch. PRD §11 changes from "human-reviewed readings" to "readings composed only from human-approved templates". Build spec B2 reading queue is dropped. |
| 2 | **Data on the device and in the person's own iCloud/Google Drive**; we host only sign-in, subscription status, and opt-in safety check-ins | See the table above. Safety flags are sent only when the person asks for a check-in (runbook and agent inputs to be updated). |
| 3 | **Native iOS and Android apps** (no added hosting; distributed through the stores) | Capacitor wraps the existing app. Web stays for demos and web sign-up. |
| 4 | **$9.99 a month or $100 a year** | Two prices in both stores and on the web (Stripe). Apple and Google set local prices per country from the US price; if a store requires a .99 price point, use $99.99. The first full reflection stays free. No free trial at launch. |
| 5 | **All countries** | See "Launching everywhere" below. |

### Launching everywhere: what it takes

- **Stores handle tax and local pricing.** Apple and Google act as the seller in every country, collect sales tax and VAT, and convert the $9.99 tier into local prices.
- **Web checkout links** are allowed only on the US App Store; everywhere else the app uses in-app purchase. Web sign-ups use Stripe through RevenueCat.
- **Privacy laws** (GDPR in the EU and UK, LGPD in Brazil, and others) are much lighter when personal data never reaches our servers, but we still need: a privacy policy, in-app account deletion, a data-request contact, and consent for the opt-in safety check-in. Privacy review is still required before launch.
- **Safety resources in every country.** We can't hand-verify 190+ countries before launch. Proposed: an emergency number for each country (a public, verifiable list) plus a link to a global helpline directory such as findahelpline.com, with hand-verified local lines added for the top countries by sign-ups. Needs your approval.
- **Language:** the content is English only. The app can launch everywhere in English; translation is a separate project, because every translated template needs approval too.
- **China mainland** requires a government ICP filing for App Store apps. Recommend excluding it at launch.
- **Age:** 18+, per the PRD. Set the store age ratings to match.

---

## Subscriber depth

Specified in [`readings-engine.md`](readings-engine.md) Part 2: a deeper rule-based library (deep natal report, Navamsa and Dashamsa, aspect patterns, house rulers, monthly and yearly timing with exact dates, full synastry and composite) and an optional AI-written layer grounded in the calculated chart, pending a decision.

---

## Group C: after the pilot (G3+), per PRD

Multiple relationships, friendships and family, progressions and Davison charts, optional end-to-end encrypted sync between devices.

---

## Recommended order

1. **A1 Template review console.** Nothing else turns draft readings into approved ones.
2. **A2 Interview mode**, so Stage 1 can start while A1 is in review.
3. **A4 Accessibility pass** (small, catches structural issues early).
4. **A3 Deeper personalization**, reviewed through A1 as it lands.
5. **B3 on-device storage with iCloud/Google Drive sync, B1 sign-in, B2 payment**, inside the Capacitor iOS and Android apps.
6. B4–B6 alongside the pilot setup.

## Decisions needed

| # | Decision | Needed for |
|---|---|---|
| 1 | Review templates in-app (A1) or in a spreadsheet? | A1 |
| 2 | Auth provider: Supabase Auth or Firebase Auth (recommend Supabase) | B1 |
| 3 | Safety resources plan for all countries (emergency numbers + global directory) | Safety, launch |
| 4 | Out-of-hours coverage for opt-in safety check-ins (runbook §3) | Safety |
| ~~—~~ | ~~Per-reading review~~ **Decided: approve templates up front** | A1 |
| ~~—~~ | ~~Where data lives~~ **Decided: device + the person's own iCloud/Google Drive** | B3 |
| ~~—~~ | ~~Native apps~~ **Decided: yes, via Capacitor** | B1–B3 |
| ~~—~~ | ~~Price~~ **Decided: $9.99/month** | B2 |
| ~~—~~ | ~~Countries~~ **Decided: all (China mainland excluded pending ICP filing)** | Launch |
| ~~—~~ | ~~Sign-in method~~ **Decided: Apple and Google, with an email link as the second factor** | B1 |
| ~~—~~ | ~~Reminder channel~~ **Decided by on-device storage: local notifications** | B4 |
