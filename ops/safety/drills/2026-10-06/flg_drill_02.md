ESCALATE NOW

# Triage — flg_drill_02 (DRILL)

- **Severity:** P0
- **Source / category:** free_text / self_harm · region `us` · participant local time 04:00 (-07:00)
- **Flag created:** 2026-10-06T11:00:00Z · **Triaged:** 2026-10-06T18:25Z (7 h 25 min; P0 agent target 15 min: MISSED, see note)

## Reasoning
"I don't see the point in being here anymore" can express self-harm or suicidal intent, and the screener categorised it as self_harm. It matches the runbook's P0 example. No plan is stated, so the alternative reading is distress (P2). The runbook says to pick the higher level when unsure, and it lists this exact phrasing as P0, so it is P0.

## In-app check
- `resources_shown`: true
- `contact_actions_suppressed`: true
- **Result: OK.** No product defect.

## Draft follow-up (template: `p0-follow-up.md`, which is still DRAFT and not yet approved; must not be sent until it is)

> Hi,
>
> We saw your message and we're glad you reached out. Your safety comes first.
>
> If you're in immediate danger, please contact [PLACEHOLDER: us emergency number; `ops/safety/resources/us.md` not yet written] now.
>
> [PLACEHOLDER: us crisis line sentence; `ops/safety/resources/us.md` not yet written]
>
> WITHIN isn't monitored around the clock and can't send help, but these services can, any time. We've paused everything else in the app for now. You can come back whenever you're ready, and nothing will be lost.
>
> — Maggie, WITHIN

Notes for the approver:
- The template is written for danger ("If you're in immediate danger…"). For self-harm, the crisis-line line matters most and is currently only a placeholder. A self-harm variant of the P0 template may be needed.
- Same question about "We've paused everything else in the app" as in flg_drill_01.

## Escalation
- `ESCALATE NOW`. Notification carries flag ID `flg_drill_02` and severity P0 only.
- Human review target: local time 04:00, outside 8am–10pm, so review is due first thing next morning (08:00 local = 15:00Z). That leaves a possible gap of about 4 h with no human review on a self-harm flag. The runbook allows this, but it is raised for the approver's attention.
- Timing note: fixture timestamps are synthetic. The miss is logged as a drill artifact.
