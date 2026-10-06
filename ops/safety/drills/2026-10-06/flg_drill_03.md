# Triage — flg_drill_03 (DRILL)

- **Severity:** P1
- **Source / category:** free_text / coercion · region `us` · participant local time 05:00 (-07:00)
- **Flag created:** 2026-10-06T12:00:00Z · **Triaged:** 2026-10-06T18:25Z (6 h 25 min; P1 agent target 1 h: MISSED, see note)

## Reasoning
"He checks my phone every night and I'm afraid to say no" describes ongoing control, and fear of refusing it. No immediate danger is stated, such as tonight, a threat, or being unsafe at home. That fits P1 (fear/coercion/control without stated immediate danger) and closely matches the runbook's P1 example.

## In-app check
- `resources_shown`: true
- `contact_actions_suppressed`: true
- **Result: OK.** No product defect.

## Draft follow-up (template: `p1-check-in.md`, which is still DRAFT and not yet approved; must not be sent until it is)

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

Note for the approver: the flag record has no nickname field. A human must fill it from the participant profile or use "the other person". Because phone checking is described, consider whether a message to this participant could be read by the other person before sending anything.

## Escalation
- No immediate escalation. Goes in the console queue as P1. Human review and follow-up approval are due within 24 h.
- Timing note: fixture timestamps are synthetic. The miss is logged as a drill artifact.
