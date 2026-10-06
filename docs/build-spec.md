# WITHIN — Build specification
Draft 0.1 · October 6, 2026 · Derived from [`prd-v0.1.md`](prd-v0.1.md) and [`design/concept-renderings-a-b.webp`](design/concept-renderings-a-b.webp)

> **Scope of this document.** This turns the PRD and concept renderings into an engineering plan: architecture, data model, screens, epics, and release gates. It inherits the PRD's constraint (§13): it **does not authorize** coding beyond the throwaway prototype in Gate 1, procurement, deployment, or collecting real participant data. Each gate below names what must be approved before the next one starts.

---

## 1. Build strategy in one paragraph

Build in gated layers that match the PRD's validation stages. First, a **clickable prototype on fixture data** (no real birth data, no backend) to run the Stage 1 interviews and reviewed examples. Second, a **concierge pilot build**: a mobile web app (PWA) where the system calculates charts but every reading is **assembled and approved by a human** in an operator console before the participant sees it. Only after pilot results clear the thresholds do we automate interpretation assembly for a limited beta. Western and Vedic are first-class from the first build; each has its own calculation path, content, reviewer, and provenance trail.

---

## 2. Design review: renderings vs. PRD

The renderings set the tone well and get the three-tab IA right. They need these changes before they become build specs:

| # | What the rendering shows | PRD requirement | Build decision |
|---|---|---|---|
| D1 | No screen labels a **Western** or **Vedic** perspective | §6, §7: both traditions as labeled, equal-weight perspectives | Add the reflection layout in §5.3: two side-by-side/stacked perspective cards with a tradition label, then a "Together" card. This is the most important missing screen. |
| D2 | Pillars are mapped one-per-tab (Self→Today, Other/Relationship→Relationships, Purpose→My Growth) | §4: Today = intention + one reflection + next step; four pillars live under Relationships; self-only use must be complete | Today shows the **current reflection** (it can be Self-focused). Four pillars are a segmented control inside a relationship. Self-only users get a "You" space with Self + Purpose and no empty Other/Relationship states. |
| D3 | "$9.99/month" footer | §10: no price selected; test alternatives | Treat as concept copy only. Billing is out of the pilot build (Epic 11). |
| D4 | Side taglines: "A brighter tomorrow", "A stronger bond", "A more peaceful us" | §1: preserving the relationship isn't inherently the goal; no outcome forecasts | Marketing copy must not imply the app predicts or targets relationship continuation. Swap for user-centered lines ("Look within", "Small steps", "Real moments"). Editorial review item. |
| D5 | Relationship timeline: "First meeting / A turning point / Today" | §5C, §8: exact/approximate/range dates; meaning supplied by the user; no invented events | Timeline nodes render date precision visibly (e.g., "~Spring 2023", "2021–2022"). Only user-entered milestones appear. |
| D6 | "What could you ask instead of assuming?" on the Other screen | §5B: possibilities and questions, never claims about the other person's mind | Good model. Every Other-pillar string follows this question pattern. Content lint rule (§8.3). |
| D7 | Purpose screen: "What did you learn? More clarity / Still exploring" | §5E: attempted / not attempted / deliberately paused; helpful / neutral / unhelpful; notes; next intention | Expand into the follow-up flow in §5.6. The chips stay as a quick first step. |
| D8 | Tab labels ~10px; light grey secondary text | §9: adjustable text, adequate contrast | Minimum 12px tab labels; support dynamic type up to 200%. Measured: terracotta CTA `#B5583F` on white text = 4.74:1 (passes AA). A light grey like `#8C8178` on cream = 3.36:1 (**fails** for body text). Use `#6E625A` (5.22:1) or darker. |
| D9 | Active tab marked by color + filled icon | §9: non-color status indicators | Keep the filled icon and bold label. Add `aria-current="page"`. |

**Rendering A vs. B:** the screens are identical. B's botanical and landscape illustrations suit marketing and onboarding. **Use A's restraint inside the product.** B's illustrated landscape behind the timeline (Relationship screen) is the one in-app exception worth testing, provided it stays decorative (`aria-hidden`).

---

## 3. Architecture

```
┌─────────────────────────┐      ┌──────────────────────────┐
│ Participant PWA         │      │ Operator console         │
│ Next.js (React, TS)     │      │ (same app, staff role)   │
│ Today · Relationships · │      │ reading queue · safety   │
│ My Growth · Settings    │      │ queue · error reports    │
└───────────┬─────────────┘      └────────────┬─────────────┘
            │  HTTPS (TLS 1.2+)                │
┌───────────▼──────────────────────────────────▼─────────────┐
│ App API (TypeScript; tRPC or REST)                         │
│ auth · profiles · relationships · reflections · actions ·  │
│ journal · export/delete · notifications · audit log        │
└───┬───────────────┬──────────────────┬─────────────────┬───┘
    │               │                  │                 │
┌───▼─────────┐ ┌───▼─────────────┐ ┌──▼─────────────┐ ┌─▼────────────┐
│ Postgres    │ │ Calc service    │ │ Interpretation │ │ Safety       │
│ app data;   │ │ (isolated)      │ │ assembler      │ │ screener     │
│ sensitive   │ │ Western+Vedic   │ │ approved       │ │ free text →  │
│ fields enc. │ │ → typed facts + │ │ templates →    │ │ flags →      │
│ at app layer│ │ engine version  │ │ draft reading  │ │ human queue  │
└─────────────┘ └─────────────────┘ └────────────────┘ └──────────────┘
```

### 3.1 Stack (recommended defaults, confirm at Gate 0)

| Layer | Default | Why |
|---|---|---|
| Client | Next.js + TypeScript, installable PWA | PRD rules out a native-app commitment. One codebase covers participant + operator. |
| UI | Headless accessible primitives (e.g., Radix) + CSS tokens (§6) | Keyboard and screen-reader behavior come built in. |
| API/DB | TypeScript service, Postgres, migrations in repo | Relational data (relationships ↔ milestones ↔ reflections) and auditability. |
| Calculation | Separate service wrapping a validated ephemeris (e.g., Swiss Ephemeris) | Isolates licensing (Swiss Ephemeris is AGPL or commercial; this is open decision #4). Lets each tradition's conventions be versioned. |
| Field encryption | Envelope encryption (KMS-held key, per-record data keys) for birth data, notes, journal, milestones | §9: encrypt sensitive data; limit staff access. |
| Hosting | Region chosen by launch geography (decision #1) | Data residency follows the privacy review. |
| Analytics | First-party event table; no third-party ad SDKs | §9: no advertising based on intimate data. Events never contain free text. |

### 3.2 Calculation service contract

Input: birth date, time (or `null`), time precision, place (lat/long + resolved IANA timezone + UTC offset used), and a **convention profile id** per tradition (e.g., `western.tropical.placidus.v1`, `vedic.sidereal.<ayanamsa>.v1`). Practitioners pick the conventions at Gate 0. The code takes them as config, never hard-codes them.

Output: a `CalculationSnapshot`:
- `engine`, `engine_version`, `ephemeris_version`, `convention_profile`, `inputs_hash`
- `facts[]`: typed placements, aspects/yogas, timing periods. Each fact carries `validity: valid | time_sensitive_unavailable | approximate`.
- **Time-sensitivity rule:** when birth time is unknown, every time-dependent fact (ascendant, houses, Moon degree where it matters, nakshatra pada, dasha start dates) is returned as `time_sensitive_unavailable`, never computed from a guessed noon time. Practitioners define the list per tradition (§7 PRD).

Snapshots are immutable. Editing birth inputs creates a new snapshot and marks dependent interpretations `stale` (§8 PRD).

### 3.3 Interpretation assembly

1. **Select:** rules map `facts` + chosen purpose + pillar to **approved content templates** for each tradition independently.
2. **Compose:** fill templates. Optional AI phrasing comes only after Gate 3 and is constrained to the selected templates and facts. A validator rejects any output that mentions a placement, degree, or date not present in `facts`.
3. **Review:** in the pilot, every reading enters the operator queue and a human approves it. Post-pilot, sampling plus user error reports.
4. **Persist provenance:** each rendered perspective stores `snapshot_id`, `template_ids@revision`, `reviewer_id`, `reviewed_at`, `assembler_version`.

There is no combined score and no averaging. "Together" is authored from a template set for agreement and divergence that the practitioners approve (contradiction handling, PRD §7).

---

## 4. Data model (core entities)

Encrypted fields marked 🔒. Every table has `created_at`, `updated_at`, `deleted_at` (soft-delete window; hard delete per §9.4).

| Entity | Key fields |
|---|---|
| `User` | id, auth identity, locale, region, consent records |
| `BirthProfile` | owner (`self` or `Person`), 🔒date, `date_precision` (exact/approx), 🔒time, `time_precision` (exact/approx ±min/unknown), 🔒place, resolved tz, `source` (self-reported/estimated) |
| `Person` | user_id, 🔒nickname (no surname/contact fields), `birth_profile_id?`, `consent_basis` (unknown/stated_by_user — never assumed) |
| `Relationship` | user_id, person_id, label (user-chosen), `status` active/archived, `focus` (what they want help understanding) |
| `Milestone` | relationship_id, type (meeting/commitment/conflict/separation/reconciliation/custom), 🔒title, 🔒meaning, `date_kind` exact/approximate/range, date_start, date_end, `excluded_from_reflections` |
| `Intention` | user_id, relationship_id?, value, 🔒behavior, status active/changed/archived, `previous_intention_id` |
| `Reflection` | user_id, relationship_id?, pillar, kind (initial/weekly_chapter/milestone), 🔒situation_summary (user-editable), intention_id, state draft/in_review/published/stale |
| `Perspective` | reflection_id, tradition western/vedic/together, 🔒body, 🔒detail, `unavailable_elements[]`, limitations_note, provenance (§3.3) |
| `CalculationSnapshot` | §3.2, immutable |
| `ContentTemplate` | tradition, pillar, fact selectors, body, revision, reviewer, review_date, status, revision history |
| `Action` | reflection_id, intention_id, `choice` action/pause/none, 🔒text, follow_up_at? |
| `FollowUp` | action_id, `attempt` attempted/not_attempted/paused, `usefulness` helpful/neutral/unhelpful, 🔒notes, next_intention_id? |
| `JournalEntry` | user_id, relationship_id?, 🔒body (never sent to analytics or models without separate consent) |
| `Feedback` | perspective_id, kind (does_not_fit/error/unclear/harmful), 🔒note → review queue |
| `SafetyFlag` | source (free text / feedback), category (fear/coercion/self_harm/danger), status, assignee |
| `NotificationPref` | opt-in per type, discreet copy default, quiet hours |
| `AuditEvent` | actor (user/staff/system), action, entity, timestamp. **Staff reads of encrypted fields are always logged.** |

---

## 5. Screens and flows

The bottom nav follows the renderings: **Today · Relationships · My Growth**. Settings sits behind the profile icon.

### 5.1 Onboarding (PRD §4, eight steps)

| Step | Screen | Notes |
|---|---|---|
| 1 | "What would you like help understanding?" | Chips: recurring patterns, communication, boundaries, uncertainty, transition, plus free text. Free text goes through the safety screener. |
| 2 | "What would a useful outcome look like?" | Clarity, expressing a need, preparing a conversation, acceptance, defining a boundary. |
| 3 | How this works, and its limits | ≤ 120 words. States that this is interpretation, not prediction, and the user decides. |
| 4 | Your birth details | Each field has a "Why we ask" note. Time: exact / approximate (± window) / I don't know. Place: search → shows the resolved timezone for confirmation. |
| 5 | Just me, or add someone? | "Just me" is the primary button. Adding someone asks for a nickname only; birth details are skippable. |
| 6 | First reflection | §5.3 layout, with unavailable elements named ("Your rising sign needs a birth time, so it isn't included."). |
| 7 | One question + choose: a step / a deliberate pause / nothing for now | |
| 8 | Save + optional reminder | The notification permission prompt appears only after the user taps "Remind me". Continuing works without it. |

Progress autosaves after each step and every step is editable later. No upsell appears anywhere in onboarding.

### 5.2 Today
Header shows the current intention ("My purpose: Speak honestly, stay connected" from the renderings). Below it: one reflection card, one next step, then an explicit **finish state** ("You're done for today"), with no infinite feed.

### 5.3 Reflection (new; resolves D1)
In order: **Your situation** (editable) → **Your purpose** → **Western perspective** → **Vedic perspective** → **Together** → **Reflection question** → **Next step / pause** → **Follow-up time**.
- The Western and Vedic cards share one component with identical size and depth. Display order is randomized per user and stored, so the pilot can compare orders (PRD §11).
- Each card has a tradition label, plain-language body, "Show the details" (placements + method disclosure + provenance), a limitations note when relevant, and **"This doesn't fit"** (→ `Feedback`).
- A stale reflection shows a banner: "Your birth details changed. Refresh this reflection." Historical notes are never rewritten.

### 5.4 Relationships
List → relationship home with segmented **Self · Other · Relationship · Purpose** (renderings' visuals: orbit, overlapping circles, horizon timeline, leaf).
- **Other:** question-framed only (D6). If the other person's birth details are missing, it shows a non-chart reflection plus "Add details (optional)".
- **Relationship:** horizontal timeline of user milestones with visible date precision (D5). "Add a meaningful date" opens the milestone form (type, date kind, meaning, exclude toggle). Tapping a milestone shows three separately labeled blocks: *You told us* / *This tradition offers* / *A question to consider*.
- **Archive relationship:** neutral confirmation, no celebratory or judgmental copy. The relationship stays readable and exportable.

### 5.5 My Growth
Goals (intentions + history of changes), journal, actions, and **observed changes** (user-written). No streaks, scores, or compatibility numbers.

### 5.6 Follow-up (resolves D7)
"Did you try it?" Tried / Didn't / Chose to pause → "How was it?" Helpful / Neutral / Unhelpful → optional note → "What's next?" (keep / adjust / new intention / nothing). Quick chips ("More clarity", "Still exploring") prefill but never replace these fields.

### 5.7 Settings
Method explanations (per tradition, versioned), birth details, privacy and consent, notifications, **Export** (JSON + readable PDF/HTML), **Delete account** and per-relationship delete, safety resources (free, always reachable).

---

## 6. Design tokens (sampled from the renderings; confirm with design)

```css
:root {
  --bg: #F7F0E8;          /* cream */
  --surface: #FBF7F2;
  --ink-display: #4A1D33; /* plum headlines, 12.3:1 on bg */
  --ink-body: #3B302A;
  --ink-muted: #6E625A;   /* ≥ 4.5:1; never lighter for text */
  --accent: #B5583F;      /* terracotta CTA, white text 4.74:1 */
  --accent-pressed: #A84D36;
  --gold: #B8904F;        /* decorative only, not text */
  --radius-card: 16px; --radius-button: 999px;
  --font-display: a high-contrast serif (license TBD);
  --font-body: a humanist sans (license TBD);
}
```
Dark mode is a Gate 2 nice-to-have, not pilot-blocking. Illustrations are SVG/WebP, `aria-hidden`, and never carry meaning.

---

## 7. Instrumentation (for PRD §3 and §11 metrics)

Events contain IDs, enums, and timestamps only, **never free text, names, or birth data**.

`onboarding_step_completed{step}`, `first_reflection_viewed`, `comprehension_check_answered{correct}` (pilot only), `perspective_detail_opened{tradition}`, `does_not_fit_submitted{tradition}`, `action_chosen{choice}`, `follow_up_completed{attempt, usefulness}`, `session_finished`, `voluntary_return{week}` (excludes research appointments, which are flagged by operators), `anxiety_check{score}` (pilot survey), `export_requested`, `deletion_completed`.

The primary metric dashboard reports **numerator, denominator, and withdrawals separately** (PRD §3, §11).

---

## 8. Safety, privacy, and content controls

### 8.1 Safety screener
- Runs on all free text (onboarding, situation, notes, journal, if the user opts in to journal screening) before any reflection is assembled.
- Categories: fear of partner, coercion, immediate danger, self-harm.
- On a match: **suppress contact-the-person actions**, show region-appropriate resources (curated list, human-reviewed), and route a `SafetyFlag` to the human queue. The app makes no automated emergency-contact promise.
- The safety test suite (fixture texts with expected behavior) is a release-blocking CI job.

### 8.2 Privacy
- Self-only mode is the default until the third-party data policy is approved (decision #3). The "Add someone" flow ships behind a flag.
- No address-book access, no public profiles, no ad SDKs.
- Export: everything the user entered plus every reflection with provenance.
- Deletion: hard-delete pipeline with a defined backup-expiry window. **Tested end to end with dummy records before Gate 2.**
- Notifications are discreet by default ("You have a reflection waiting") with no names or relationship details.

### 8.3 Content lint (CI on the template repo)
Rejects templates containing certainty and destiny language ("will", "destined", "soulmate", "karmic debt", "always", "never" when said of a person), mind-reading verbs about the Other ("they feel", "they want", "they intend"), diagnoses, stay/leave directives, and scores. Every template needs a tradition, a reviewer, a review date, and a revision.

---

## 9. Epics

| Epic | Scope | Key acceptance (from PRD) | Gate |
|---|---|---|---|
| **E0 Decisions** | Resolve PRD §13 items 1–6; pick conventions, calc source, region | Written sign-offs on file | G0 |
| **E1 Prototype** | Clickable PWA on fixture data covering all §5 screens, using Rendering A visuals + the D1–D9 fixes | Usable in Stage 1 interviews; contains no real data | G1 |
| **E2 Accounts & birth data** | Auth, onboarding, precision-aware birth profile, timezone resolution | No invented birth time; every field explained | G2 |
| **E3 Calculation service** | Western + Vedic per convention profile, snapshots, time-sensitivity | Practitioner reference cases match within agreed tolerance | G2 |
| **E4 Content system** | Templates, review workflow, provenance, lint, correction notices | Each perspective traceable to template revision + reviewer | G2 |
| **E5 Reflection & Today** | §5.2–5.3, order randomization, stale handling, does-not-fit | Both lenses equal; unavailable elements named | G2 |
| **E6 Relationships** | Pillars, Other (question-framed), timeline, milestones, archive | Date precision visible; no invented events | G2 |
| **E7 My Growth & follow-up** | Intentions, journal, actions, §5.6 follow-up | Every journey links to an intention; pause is first-class | G2 |
| **E8 Safety** | Screener, resources, human queue, test suite | Safety suite green; human owner staffed | G2 |
| **E9 Privacy & ops** | Encryption, audit, export, deletion, notifications | Dummy-record export/delete passes; staff access logged | G2 |
| **E10 Pilot console & metrics** | Operator reading queue, research flags, §7 dashboard | Every pilot reading human-approved | G2 |
| **E11 Billing** | Subscription, disclosure, cancellation | Only if a commercial test is approved; no distress-triggered upsell | G3+ |
| **E12 Accessibility** | Cross-cutting: keyboard, screen reader, dynamic type, contrast | Tested with VoiceOver + TalkBack by real users | G2 / G4 |

Deferred per PRD (do not build, but don't block in the schema): multiple simultaneous relationships (the schema already allows N; the UI caps at 1), family/child profiles, joint accounts, progressions/Davison (add new convention profiles), date selection, community, chat, native apps.

---

## 10. Gates

| Gate | Unlocks | Must be true |
|---|---|---|
| **G0 Decisions** | Building E1 | Product owner authorizes prototype work; brand name cleared enough for interview materials |
| **G1 Stage 1 complete** | Building E2–E10 | 15–20 interviews done; reviewed examples for communication / patterns / transition; D1–D9 validated or revised; §13 decisions 1–4 made |
| **G2 Pilot-ready** | Collecting real pilot birth data (20–30 adults, 4 weeks) | Privacy review for chosen region; practitioner sign-off on calc conventions + reference cases + templates (both traditions); safety suite green and human owners named; export/delete verified with dummy data; a11y audit with assistive tech; separate authorization to recruit |
| **G3 Beta decision** | Automation of assembly, optional AI phrasing, E11 | Pilot vs. thresholds: ≥80% unassisted journey, ≥80% comprehension, ≥60% action/pause + follow-up by day 7, ≥50% voluntary week-2 return, dual-lens value without more confusion/anxiety; raw counts + withdrawals reported; zero open critical defects |
| **G4 Release** | Limited beta | PRD §12 checklist complete |

---

## 11. Open questions for the product owner

1. **IA (D2):** confirm that pillars live inside relationships and that self-only users get a "You" space, rather than one pillar per tab as rendered.
2. **Taglines (D4):** OK to replace relationship-continuation phrasing in marketing?
3. **Calculation source:** commercial Swiss Ephemeris license vs. AGPL-compliant open-sourcing of the calc service vs. a third-party API. This affects cost and the architecture boundary.
4. **Practitioners:** who are the named Western and Vedic reviewers, and what is their turnaround SLA for pilot readings? That SLA sets pilot capacity.
5. **Operator staffing:** who owns the safety queue during the pilot, and in what hours?
6. **Rendering B illustrations:** in-app timeline background, or marketing only?
