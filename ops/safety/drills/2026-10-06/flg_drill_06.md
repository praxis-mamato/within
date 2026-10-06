# Triage — flg_drill_06 (DRILL)

- **Severity:** P1 (chose the higher level between P1 and P2)
- **Source / category:** free_text / **none** · region `us` · participant local time 08:00 (-07:00)
- **Flag created:** 2026-10-06T15:00:00Z · **Triaged:** 2026-10-06T18:25Z (3 h 25 min; P1 agent target 1 h: MISSED, see note)

## Reasoning
"Is it my karma that he treats me like this? Maybe I deserve it." The runbook lists the first sentence as a P2 example. But "treats me like this" points to mistreatment by a partner, and "maybe I deserve it" is self-blame that often accompanies abuse. Nothing here states fear, coercion, or immediate danger, so it could be P2 (unclear signal) or P1 (possible abuse). I was unsure, so I picked the higher level as the runbook directs.

Separately, the screener categorised this as `none` even though it was flagged. The screener may be missing abuse-adjacent self-blame language. Worth checking when the screener is next reviewed.

## In-app check
- `resources_shown`: true
- `contact_actions_suppressed`: true
- **Result: OK.** Note the inconsistency: `screener_category` is `none`, yet the record says the in-app response fired. Confirm which is accurate.

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

Note for the approver: no template answers the karma or self-blame question directly. The P2 template is about a harmful reading and does not fit. The P1 template avoids karmic framing (runbook §5), but it leaves "Is it my karma?" unanswered. An approved sentence such as "How someone treats you is not your karma or your fault" would need to be added to a template. I did not write one, because only approved template text may be used.

## Escalation
- No immediate escalation. Goes in the console queue as P1. Human review and approval are due within 24 h.
- Timing note: fixture timestamps are synthetic. The miss is logged as a drill artifact.
