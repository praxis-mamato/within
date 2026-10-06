# Safety runbook — WITHIN pilot
Draft 0.1 · October 6, 2026 · Owner: Maggie Amato (approver and escalation contact)

This is the procedure for safety flags during the concierge pilot (build spec §8.4). The [safety ops agent](../../.claude/agents/safety-ops.md) follows it, and so does any human covering the queue.

**WITHIN is not an emergency service and is not monitored around the clock.** Participants are told this at consent and on every resources screen.

## 1. Where flags come from

| Source | Created by |
|---|---|
| Free text (onboarding, situation, notes, opted-in journal) matching a safety category | In-app screener (E8) |
| "This doesn't fit" or error report marked *harmful* | Participant |
| Anything an operator notices while approving readings | Approver |

At the moment of a match, the app has **already** shown the region's resources and suppressed any action that suggests contacting or confronting the other person. The agent's job starts after that.

## 2. Severity

| Level | Definition | Examples |
|---|---|---|
| **P0** | Immediate danger to the participant or someone else, or self-harm intent or plan; **or** an in-app safety response that failed to fire | "I'm scared to go home tonight"; "I don't see the point in being here anymore"; flag record shows `resources_shown: false` |
| **P1** | Fear, coercion, control, or abuse without a stated immediate danger | "He checks my phone and I'm afraid to say no"; "She said she'll leave with the kids if I see my friends" |
| **P2** | Distress, an unclear signal, or a report that a reading was harmful or frightening | "This reading made me feel doomed"; "Is it my karma that he treats me like this?" |

When unsure between two levels, choose the higher one.

## 3. Response targets (pilot)

| Level | Agent triage | Human review | Human approves follow-up |
|---|---|---|---|
| P0 | within 15 min of flag | within 2 h, 8am–10pm participant local time; first thing next morning otherwise | same review |
| P1 | within 1 h | within 24 h | within 24 h |
| P2 | within 4 h | within 48 h | within 48 h |

The agent runs **hourly** during the pilot and immediately on a new P0/P1 flag. A missed target is logged, never hidden.

## 4. Escalation

- **P0 or in-app defect:** the agent writes `ESCALATE NOW` at the top of its triage file and shift log. The notification step (push + email to Maggie) fires on that line. The notification contains the flag ID and severity only, no participant text or names.
- **P1/P2:** appear in the console queue sorted by severity, then age.
- **Approver unavailable over 48 h:** the named delegate covers the queue. With no delegate, intake of new participants pauses.
- **Serious incident** (harm linked to the app, a P0 missed by over 24 h, a privacy breach): pause the pilot and investigate (PRD §11).

## 5. Follow-up messages

- Only from approved templates in `ops/safety/templates/`, always sent by a human.
- Never suggest contacting, confronting, or "talking it through with" the other person when fear or coercion is present.
- Never frame abuse as karma, a lesson, or a chart outcome.
- Never promise intervention, monitoring, or a call back at a specific time unless a named person has committed to it.

## 6. Flag file schema (`ops/safety/queue/*.json`)

```json
{
  "flag_id": "flg_…",
  "created_at": "ISO-8601 UTC",
  "participant_ref": "pseudonymous id, never a name",
  "region": "resource list key, e.g. us",
  "local_time": "ISO-8601 with offset",
  "source": "free_text | feedback_harmful | operator",
  "screener_category": "fear | coercion | danger | self_harm | harmful_output | none",
  "text": "the minimum excerpt that triggered the flag",
  "resources_shown": true,
  "contact_actions_suppressed": true
}
```

Fixtures add an `expected` block: `{"severity": "P0|P1|P2", "in_app_ok": true|false}`.

## 7. Drills

Run the agent against `ops/safety/fixtures/` before G2, after any change to the screener, templates, or agent instructions, and weekly during the pilot. **Pass:** every fixture matches its expected severity or a higher one, every in-app defect is escalated, and no draft breaks §5. Any under-triaged P0 is a fail and blocks the pilot from starting or continuing.

## 8. Before G2 (open items)

- [ ] Region resource lists written and checked by a human for the launch geography (`ops/safety/resources/<region>.md`).
- [ ] Follow-up templates approved by Maggie.
- [ ] Delegate named, or the intake-pause rule accepted.
- [ ] Consent wording on AI triage and on not being an emergency service approved in the privacy review.
- [ ] Drill passed.
