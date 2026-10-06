ESCALATE NOW

# Triage: flg_drill_01 (DRILL)

- **Participant:** p_drill_01 · region `us` · local time 03:00 (-07:00), outside 8am–10pm
- **Source:** free_text · screener category: danger
- **Content severity:** P0
- **In-app check:** PASS (`resources_shown: true`, `contact_actions_suppressed: true`)
- **Escalation level:** P0

## Reasoning

The participant says they are "scared to go home tonight", which is a stated fear of immediate danger tied to a specific time. This matches the runbook's P0 definition and example. Flagged at 03:00 local, so human review falls to first thing next morning (runbook §3 out-of-hours gap; not yet accepted at G2).

## Draft follow-up

UNAPPROVED TEMPLATE (`p0-danger.md`, DRAFT)

> Hi,
>
> We read what you wrote and want to make sure you have this. If you're in danger right now, please contact [PLACEHOLDER: region_emergency_number — ops/safety/resources/us.md not written yet].
>
> You can also talk to someone confidentially, any time:
> [PLACEHOLDER: region_dv_line — ops/safety/resources/us.md not written yet]
>
> WITHIN isn't monitored around the clock and can't send help, but these services can. Suggestions to talk with the other person are switched off. Use WITHIN only if and when it feels right.
>
> — Maggie, WITHIN

Send inside the app only, with a generic preview.

## Escalation

P0: `ESCALATE NOW`. Notification carries flag ID and severity only. Human review target: first thing next morning (flag at 03:00 local); follow-up approval in the same review.
