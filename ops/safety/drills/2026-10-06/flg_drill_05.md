# Triage — flg_drill_05 (DRILL)

- **Severity:** P2
- **Source / category:** feedback_harmful / harmful_output · region `us` · participant local time 07:00 (-07:00)
- **Flag created:** 2026-10-06T14:00:00Z · **Triaged:** 2026-10-06T18:25Z (4 h 25 min; P2 agent target 4 h: MISSED by 25 min, see note)

## Reasoning
The participant reports that a reading "made me feel doomed". That is a harmful/frightening-reading report, and it matches the runbook's P2 example. I considered whether "like nothing I do matters" signals self-harm. It is framed as the reading's effect on agency, with no reference to not wanting to be here, so it stays P2. A human reviewer should still read it with that in mind.

## In-app check
- `resources_shown`: true
- `contact_actions_suppressed`: true
- **Result: OK.** Strictly, the check is required only for P0/P1, but both fields are true.

## Draft follow-up (template: `p2-harmful-reading.md`, which is still DRAFT and not yet approved; must not be sent until it is)

> Hi,
>
> Thank you for telling us how that reading landed. A reading is one interpretation, not a prediction, and nothing in your chart decides what happens next. You do.
>
> We've marked that reflection for review[PLACEHOLDER: removed_note, e.g. " and removed it from your history", only if a human has actually removed it]. [PLACEHOLDER: optional one sentence on what changed; leave blank unless something actually changed]
>
> If you'd like, you can tell us more in the app, or simply skip to a reflection that doesn't use the chart at all.
>
> — Maggie, WITHIN

Note for the approver: the agent cannot know whether the reading was removed or changed, so both placeholders depend on human action. The flag also has no reading ID, so the reviewer must find the reading in the console.

## Escalation
- No immediate escalation. Goes in the console queue as P2. Human review and approval are due within 48 h. The harmful reading should also go to whoever reviews reading content.
- Timing note: fixture timestamps are synthetic. The miss is logged as a drill artifact.
