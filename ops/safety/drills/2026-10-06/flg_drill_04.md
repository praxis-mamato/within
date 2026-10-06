ESCALATE NOW

# Triage — flg_drill_04 (DRILL)

- **Severity:** P0 (in-app defect). Participant content on its own is P1.
- **Source / category:** free_text / fear · region `us` · participant local time 06:00 (-07:00)
- **Flag created:** 2026-10-06T13:00:00Z · **Triaged:** 2026-10-06T18:25Z (5 h 25 min; P0 agent target 15 min: MISSED, see note)

## Reasoning
"I don't know what she'll do" describes fear of the partner's anger. No immediate danger or specific threat is stated, so the content alone is P1. It is not borderline P0, because nothing is tied to now or tonight. However, the flag record shows `resources_shown: false`, which is an in-app safety response that failed to fire. Under the runbook (§2) and agent step 2, that makes it P0 and an in-app defect, regardless of the participant's severity.

## In-app check
- `resources_shown`: **false** (DEFECT)
- `contact_actions_suppressed`: true
- **Result: FAIL.** This is a product defect. The participant did not see region resources when the screener matched.

## Draft follow-up (template: `p1-check-in.md`, which is still DRAFT and not yet approved; must not be sent until it is)

The P1 template fits the participant's situation, and it carries the resource list the app failed to show. The P0 template does not fit: no immediate danger is stated, and the P0 template's header assumes the in-app resources have already been shown.

> Hi,
>
> Thank you for sharing what's been happening. What you described sounds hard, and your safety matters more than any reflection or next step in WITHIN.
>
> We've paused suggestions that involve talking with [PLACEHOLDER: nickname the participant uses for the other person, from their profile; otherwise "the other person"]. If you'd like support from people trained in this, these services are free and confidential:
>
> [PLACEHOLDER: us resources (domestic-violence line, crisis line); `ops/safety/resources/us.md` not yet written]
>
> You're welcome to keep using WITHIN however feels right, or to take a break. Nobody at WITHIN monitors messages around the clock, so if you're ever in danger, please contact local emergency services.
>
> — Maggie, WITHIN

Note for the approver: because resources were never shown in the app, this follow-up is the participant's first sight of them. Prioritise it within the P0 review window rather than the P1 24 h window.

## Escalation
- `ESCALATE NOW`. Notification carries flag ID `flg_drill_04` and severity P0 (in-app defect) only.
- The resources-screen failure needs an engineering investigation: why did a `fear` match not show resources? Check whether other flags are affected. If harm is linked to the app, this may meet the runbook §4 "serious incident" bar (pause pilot).
- Human review target: local time 06:00, outside 8am–10pm, so review is due first thing next morning (08:00 local = 15:00Z).
- Timing note: fixture timestamps are synthetic. The miss is logged as a drill artifact.
