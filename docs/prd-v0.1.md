# Relationship Growth Companion
## Product requirements document — draft 0.1
Prepared for Maggie Amato | October 6, 2026

Status: proposed product specification, not approved implementation scope, a clinical intervention, or a delivery estimate. Based on Maggie’s brief and this conversation. This document does not repeat earlier market statistics as verified evidence. Demand for this exact combination and willingness to pay remain unvalidated. All targets below are proposed decision thresholds, not forecasts.

## 1. Product promise and purpose
“Understand your patterns. Choose your next step. Grow through your relationships.”

Use Western and Vedic astrology as separately identified interpretive lenses, together with the person’s actual experiences, values, and chosen actions. Do not present charts as proof of another person’s intentions or of future outcomes.

The product’s purpose is greater self-understanding and agency: helping people recognize patterns, identify what they want, communicate needs, and reflect on choices. Preserving a relationship is not inherently the desired outcome. Neither is ending it. The user defines their direction.

The core loop is: situation → chosen purpose → two perspectives → reflection → chosen action → observed outcome → revised intention.

## 2. Audience and scope
Proposed initial audience: adults 18+ interested in astrology who want to understand a recurring pattern or navigate a dating/partnership transition. One-person use must be complete and useful; partner participation is optional, not a prerequisite.

First pilot: English-language, mobile-friendly experience. No native-app commitment before usability and return-use validation. Launch geography and applicable privacy requirements must be selected before collecting pilot birth data.

MVP includes:
- Self profile and one adult relationship at a time.
- Western and Vedic perspectives from the first release.
- Four pillars: Self, Other, Relationship, Purpose.
- Initial profile, weekly chapter reflection, and user-selected milestone reflection.
- Private timeline, goals, journal, actions, and follow-ups.
- Optional technical detail, correction/feedback, deletion and export.

Deferred, not abandoned:
- Multiple simultaneous relationships; friendships and wider family workflows.
- Child profiles and parent–child interpretations.
- Coparenting-specific guidance and joint partner accounts.
- Progressed relationship charts, Davison charts, and additional schools of interpretation.
- Date selection, community, practitioner marketplace, open-ended chat, and native apps.

Excluded from launch: fertility/medical advice, legal/court timing, predictions of infidelity or harm, automated stay/leave recommendations, diagnoses, destiny scores, and rankings of potential partners.

## 3. Outcomes and success measures
The product must distinguish an interpretation from a user-observed outcome.

Desired user outcomes:
1. Clarity: “I can name what I need or what matters to me.”
2. Pattern awareness: “I noticed a behavior in a real situation.”
3. Agency: “I chose a next step rather than being told what to do.”
4. Constructive action: “I expressed a preference, prepared a conversation, set a boundary, or chose not to act.”
5. Learning: “I can describe what happened and what I want to adjust.”

Proposed primary metric: percentage of activated participants who complete an action or deliberate pause and subsequently report a useful learning within seven days. Report its component counts separately; do not hide low participation behind a favorable average.

Supporting metrics: unassisted onboarding completion; first-insight comprehension; voluntary week-two/week-four return; action selection; follow-up completion; perceived usefulness; comparison of clarity before/after a session; intention to pay followed by actual opt-in purchase only when a commercial pilot is approved.

Guardrails: reported anxiety, compulsive checking, loss of agency, misleading interpretations, privacy incidents, harmful advice, and failures with uncertain birth data. More screen time is not a success criterion.

## 4. Navigation and first-use journey
Three main areas:
- Today: current intention, one reflection, one next step, and a clear finish.
- Relationships: person/context, four pillars, and private milestones.
- My Growth: goals, journal, actions, and the user’s observed changes.

Settings remains secondary and contains calculation-method explanations, privacy controls, notifications, export, and deletion.

First-use flow:
1. Ask “What would you like help understanding?” Provide recurring patterns, communication, boundaries, uncertainty, or transition; allow free text.
2. Ask “What would a useful outcome look like?” Suggest clarity, expressing a need, preparing a conversation, acceptance, or defining a boundary.
3. Explain the experience and its limits in brief, readable language.
4. Collect the user’s birth information, including optional/uncertain birth time. Explain why each field is needed.
5. Ask whether to explore self only or add a relationship. Permit skipping the other person’s birth details.
6. Show a concise first reflection and both labeled perspectives, with unavailable elements explicitly marked.
7. Offer one reflection question and a choice of action, deliberate pause, or no action.
8. Save the intention; offer an optional reminder. Never require a notification permission to continue.

Allow progress saving and correction. Do not silently invent a birth time. An emotionally charged question must not trigger an urgency-based sales prompt.

## 5. Required content and user stories
### A. Self
As a user, I can explore possible themes alongside my own needs and experiences.
Acceptance: each interpretation has a tradition label, an accessible explanation, a limitations note when relevant, and a “does not fit” response. It never turns a theme into a diagnosis or fixed identity.

### B. Other
As a user, I can explore differences without claiming access to another person’s mind.
Acceptance: language uses possibilities and questions; third-party entries remain private; missing details do not prevent self-reflection. The feature does not infer motives, consent, mental health, or private behavior.

### C. Relationship
As a user, I can connect interpretations with milestones I entered.
Acceptance: event dates can be exact, approximate, or ranges. Event meaning is supplied by the user. The app never claims a conflict or meeting occurred merely because a chart suggests it. Estimated dates and missing birth times remain visible in affected results.

### D. Purpose
As a user, I choose a value and behavior I want to practice.
Acceptance: every completed journey links back to that intention. Users can change goals, choose reflection without action, or end/archive a relationship without celebratory or judgmental messaging. The app does not assign a mandatory “soul lesson.”

### E. Outcome follow-up
As a user, I record what actually happened.
Acceptance: capture attempted/not attempted/deliberately paused; helpful/neutral/unhelpful; optional notes; next intention. Do not award a compatibility score or claim astrology caused an outcome. Journals and milestone memories are not automatically republished.

## 6. Reflection format
Default session target: understandable in roughly three minutes, to be tested rather than assumed.

Each reflection contains:
1. Your situation: a concise summary of user-supplied context, editable by the user.
2. Your purpose: the chosen intention.
3. Western perspective: short interpretation with optional supporting detail.
4. Vedic perspective: equivalent space and depth, not an afterthought.
5. Together: overlap and differences; no forced consensus or combined probability score.
6. Reflection: one open question.
7. Next step: one optional action with an alternative to pause.
8. Follow-up: a user-selected check-in time, or no reminder.

Illustrative example, not a chart reading:
Situation: “I say yes and later feel resentful.”
Purpose: “Express needs without giving up connection.”
Reflection: “What did you want to say before agreeing?”
Action: “Express one preference before accepting a low-stakes plan.”
Follow-up: “Did you try it? What happened? What would you change?”
The action must be adapted or omitted when the user describes fear, coercion, or an unsafe situation.

## 7. Western–Vedic interpretation requirements
Both traditions must have meaningful launch coverage, independently reviewed by qualified practitioners. Do not divide them simplistically into “Western personality” and “Vedic destiny.”

Proposed Western coverage: natal interpretation, selected transits, relationship comparison/synastry, and a limited composite reading when input quality permits.
Proposed Vedic coverage: natal interpretation, a bounded relationship-compatibility interpretation, and a practitioner-selected timing method suitable for the weekly chapter experience.

Before production, a practitioner from each tradition must approve:
- Calculation conventions, included techniques, and input requirements.
- What remains valid when time/date/location is missing or approximate.
- Which relationship and timing interpretations are appropriate for initial use.
- Worked reference cases, explanation templates, and contradiction handling.
- A method disclosure users can understand without expertise.

These are unresolved methodology decisions, not interchangeable implementation details. Progressions and Davison remain explicit later-phase candidates rather than silently omitted from the original vision.

Every interpretation must retain its method/version and supporting calculation provenance. Numerical calculations must come from a validated calculation source; generated prose must not invent placements or precision. If a calculation is unavailable, the interface says so and offers non-chart reflection.

If AI is used, constrain it to approved evidence and content patterns. Users can report errors. Critical safety tests and calculation comparisons must pass before release. Agreement between traditions is not scientific validation, and disagreement is not resolved by averaging them.

## 8. Timeline and “current chapter”
Milestones: meeting, commitment, conflict, separation, reconciliation, or custom event. Store only what the user elects to record.

The current chapter summarizes the user’s current intention, supplied relationship context, and the two interpretive perspectives. It does not forecast a relationship’s inevitable trajectory.

Past-date exploration must distinguish:
- “You told us this happened.”
- “This tradition offers this interpretation.”
- “Here is a question to consider.”

No retrospective invention. Users can correct/delete an event, exclude it from future reflections, or archive an entire relationship. Editing birth inputs requires affected interpretations to be marked out of date until refreshed; historical notes should not be silently rewritten.

## 9. Privacy, safety, and accessibility
Proposed requirements, subject to jurisdiction-specific review:
- Minimize sensitive data. Use a nickname for another person where possible; no address-book upload.
- Offer self-only use until a third-party-data policy is approved. Do not assume entering another person’s birth data establishes their consent.
- No public profiles, advertising based on intimate journals, or model training using private entries without a separately approved, explicit consent process.
- Encrypt stored and transmitted sensitive data; limit staff access and define auditability before launch.
- Define deletion/export processes, backup retention, and exceptions before collecting real pilot data. Test them with dummy records.
- Notifications are opt-in, discreet, and contain no sensitive names or relationship details by default.
- Keyboard access, screen-reader labels, adjustable text, adequate contrast, and understandable non-color status indicators are acceptance requirements.
- No clinical or legal efficacy claims. Do not characterize abuse as karmic obligation or recommend contacting a person when the user reports fear or coercion.
- Prepare human-reviewed responses and appropriately localized support resources for disclosures of immediate danger or self-harm; no automated emergency-contact promises.

## 10. Content operations and commercial experience
Content owners: Western practitioner, Vedic practitioner, editorial/product owner, and a relationship-safety reviewer. Practitioner credentials and editorial responsibilities must be reviewed rather than assumed.

Require provenance, reviewer, review date, and revision history for approved interpretations. Sample live outputs and route reported errors to a review queue. Do not quietly edit a materially harmful answer without acknowledging the correction to affected users where appropriate.

Proposed monetization hypothesis: one complete introductory reflection free; a transparent subscription for ongoing chapters, history, and follow-ups. No price selected yet. Test alternatives before committing. Disclose recurring charges and cancellation clearly; no distress-triggered upsells. Privacy controls and access to safety information are not premium features.

Acquisition hypothesis: useful explanations and examples centered on relationship patterns and growth. No promised search rank. Separate discovery metrics from usefulness and retention; do not buy traffic before the experience demonstrates value in a small pilot.

## 11. Validation and release gates
Stage 1 — reviewed examples and interviews:
Interview 15–20 intended users; create examples for communication, recurring patterns, and transition. Review dual-tradition clarity and safety before real-data sessions.

Stage 2 — four-week concierge pilot:
Recruit 20–30 consenting adults. Include people familiar with Western, Vedic, both, and little astrology. Use human-reviewed readings. Compare single-lens and dual-lens presentations with order varied; compare readings alone with purpose/action/follow-up. This small pilot is directional, not proof of effectiveness or representative market demand.

Proposed directional thresholds:
- At least 80% finish the primary journey without facilitator intervention.
- At least 80% accurately explain the takeaway and distinguish interpretation from fact.
- At least 60% complete a chosen action or deliberate pause plus follow-up by day seven.
- At least 50% return voluntarily in week two, excluding required research appointments.
- Dual-lens presentation must show clear reported value without a material increase in confusion or anxiety; define the comparison rubric before testing.
- Zero unresolved critical safety, privacy, or incorrect-calculation defects at release.

Report raw counts and all withdrawals. Any serious safety/privacy incident pauses the pilot for investigation. Thresholds are proposed product decisions, not industry benchmarks.

Stage 3 — limited beta:
Proceed only after reviewing actual pilot results, content capacity, methodology, privacy requirements, support ownership, and unit economics. Reassess or simplify if the second lens adds complexity without value.

## 12. Release acceptance checklist
- New and returning users can complete the core loop on mobile.
- Both traditions appear as substantial, distinguishable perspectives.
- No-time, approximate-time, missing-other-profile, and conflicting-interpretation cases behave truthfully.
- Each core flow preserves purpose, user choice, and observed outcomes.
- Calculation reference cases pass practitioner review.
- Harm, coercion, dependency, privacy, and unsupported-certainty tests pass.
- Timeline corrections, archive, export, and deletion work end to end.
- Notifications and subscriptions require explicit choices; cancellation is tested if charging is enabled.
- Accessibility checks include actual assistive-technology testing, not only automated checks.
- Support and error-review responsibilities are staffed.

## 13. Decisions before implementation
Recommended defaults are above; unresolved decisions requiring product-owner agreement:
1. Initial launch geography and privacy review.
2. Exact calculation/interpretation conventions and named reviewers for both traditions.
3. Third-party data and consent model; use self-only until approved.
4. Calculation source, licensing, ongoing content costs, and hosting costs.
5. Pilot recruitment, budget, staffing, and commercial test permissions.
6. Brand/name clearance, final pricing, and distribution platform.

This specification does not authorize coding, procurement, deployment, collecting participant information, or contacting participants. Implementation requires the appropriate separate authorization.

## 14. Definition of success
A user can say: “I understand my needs more clearly, I chose what to try, and I learned something from what happened.”

A beautiful reading without that connection to purpose and lived experience is not sufficient. Neither is retention driven by anxiety or dependence.
