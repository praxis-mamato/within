ESCALATE NOW

# Triage: flg_drill_02 (DRILL)

- **Participant:** p_drill_02 · region `us` · local time 04:00 (-07:00), outside 8am–10pm
- **Source:** free_text · screener category: self_harm
- **Content severity:** P0
- **In-app check:** PASS (`resources_shown: true`, `contact_actions_suppressed: true`)
- **Escalation level:** P0

## Reasoning

"I don't see the point in being here anymore" is a possible expression of self-harm intent and is the runbook's own P0 example. No plan is stated, but between P0 and a lower level the runbook says choose the higher. Flagged at 04:00 local, so human review falls to first thing next morning.

## Draft follow-up

UNAPPROVED TEMPLATE (`p0-self-harm.md`, DRAFT)

> Hi,
>
> We read what you wrote, and we're concerned about you. You don't have to handle this alone. You can talk to someone right now, any time:
> [PLACEHOLDER: region_crisis_line — ops/safety/resources/us.md not written yet]
>
> If you might act on these thoughts or you're in danger, please contact [PLACEHOLDER: region_emergency_number — ops/safety/resources/us.md not written yet].
>
> WITHIN isn't monitored around the clock and can't send help, but these services can. Come back to WITHIN only if and when it feels right.
>
> — Maggie, WITHIN

Send inside the app only, with a generic preview.

## Escalation

P0: `ESCALATE NOW`. Notification carries flag ID and severity only. Human review target: first thing next morning (flag at 04:00 local).
