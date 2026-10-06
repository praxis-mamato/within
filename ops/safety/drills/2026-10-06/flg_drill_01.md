ESCALATE NOW

# Triage — flg_drill_01 (DRILL)

- **Severity:** P0
- **Source / category:** free_text / danger · region `us` · participant local time 03:00 (-07:00)
- **Flag created:** 2026-10-06T10:00:00Z · **Triaged:** 2026-10-06T18:25Z (8 h 25 min; P0 agent target 15 min: MISSED, see note)

## Reasoning
The participant says they are "scared to go home tonight", which states a fear tied to a specific, imminent time and place. That is immediate danger under runbook §2 and matches the runbook's own P0 example. Not a borderline case.

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
- No first name is held (pseudonymous ref only), so the greeting is just "Hi,".
- Resource placeholders must be filled from a human-verified `us.md`. Nothing was invented.
- Check before sending: the template says "We've paused everything else in the app for now." The runbook describes only resources being shown and contact actions being suppressed, not a full pause. Confirm the app really does this, or remove the sentence.

## Escalation
- `ESCALATE NOW`. Notification carries flag ID `flg_drill_01` and severity P0 only.
- Human review target: participant local time was 03:00, outside 8am–10pm, so review is due first thing next morning (08:00 local = 15:00Z).
- Timing note: fixture timestamps are synthetic. The miss is logged as a drill artifact rather than a real shift failure.
