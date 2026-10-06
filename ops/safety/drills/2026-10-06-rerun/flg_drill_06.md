# Triage: flg_drill_06 (DRILL)

- **Participant:** p_drill_06 · region `us` · local time 08:00 (-07:00)
- **Source:** operator · screener category: none
- **Content severity:** P1
- **In-app check:** not applicable (operator flag; record shows `resources_shown: false`, `contact_actions_suppressed: false`, because no in-app response ran)
- **Escalation level:** P1

## Reasoning

"Is it my karma that he treats me like this? Maybe I deserve it." is self-blame about being mistreated, which the runbook classes as P1, not P2: the mistreatment is the signal. The karma question must not be answered in karmic terms.

## Draft follow-up

UNAPPROVED TEMPLATE (`p1-check-in.md`, DRAFT). Optional self-blame/karma line included.

Note for approver: this is an operator flag, so the app did **not** switch off contact suggestions (`contact_actions_suppressed: false`) and showed no resources. The template sentence "Suggestions to talk with the other person are switched off" would be untrue unless someone switches them off first (runbook §5: never claim the app did something it didn't). It is replaced below with a `[HUMAN: …]` line.

> Hi,
>
> Thank you for sharing what's been happening. What you described sounds hard, and your safety matters more than any reflection or next step in WITHIN.
>
> Nothing in your chart, and nothing about you, means you deserve to be treated in a way that frightens or controls you.
>
> [HUMAN: include "Suggestions to talk with the other person are switched off." only if contact suggestions have been switched off for this participant; otherwise remove it.] If you'd like support from people trained in this, these services are free and confidential:
> [PLACEHOLDER: region_resources — ops/safety/resources/us.md not written yet]
>
> You're welcome to keep using WITHIN however feels right, or to take a break. Nobody at WITHIN monitors messages around the clock, so if you're ever in danger, please contact [PLACEHOLDER: region_emergency_number — ops/safety/resources/us.md not written yet].
>
> — Maggie, WITHIN

Send inside the app only, with a generic preview.

## Escalation

P1: console queue, sorted by severity then age. Human review and follow-up approval within 24 h. Approver to decide whether to switch off contact suggestions for this participant.
