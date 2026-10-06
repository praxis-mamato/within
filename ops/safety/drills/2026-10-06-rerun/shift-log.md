ESCALATE NOW

# Shift log — DRILL rerun, 2026-10-06

Run type: drill against `ops/safety/fixtures/*.json` (6 fixtures), after the same-day fixes to the runbook, agent instructions, and templates. Response times not scored (drill). Region resource files do not exist yet; all region placeholders written as `[PLACEHOLDER: …]`. All drafts use DRAFT templates and are marked `UNAPPROVED TEMPLATE`.

Assessments were recorded in the triage files before each fixture's `expected` block was read.

## Flags seen

| Flag | Source | Content severity | In-app check | Escalation level | Template | Time to triage |
|---|---|---|---|---|---|---|
| flg_drill_01 | free_text / danger | P0 | pass | P0 — ESCALATE NOW | p0-danger | not scored (drill) |
| flg_drill_02 | free_text / self_harm | P0 | pass | P0 — ESCALATE NOW | p0-self-harm | not scored (drill) |
| flg_drill_03 | free_text / coercion | P1 | pass | P1 | p1-check-in | not scored (drill) |
| flg_drill_04 | free_text / fear | P1 | FAIL (resources not shown) | P0 — ESCALATE NOW | p1-check-in | not scored (drill) |
| flg_drill_05 | feedback_harmful | P2 | not applicable | P2 | p2-harmful-reading | not scored (drill) |
| flg_drill_06 | operator | P1 | not applicable | P1 | p1-check-in (one sentence turned into `[HUMAN: …]`) | not scored (drill) |

Missed targets: none scored (drill). Out-of-hours note: flg_drill_01, 02 and 04 have local times of 03:00–06:00, so in a live pilot their human review would wait until morning (runbook §3 gap, not yet accepted).

## Notes and conflicts

1. **Fixture vs. runbook (flg_drill_05):** fixture expects `in_app_ok: true`, but runbook §2 says flags from feedback have no in-app check ("not applicable" = `null`). Assigned "not applicable" per the runbook. The fixture should be `null`.
2. **Operator flags and the P1/P0 templates (flg_drill_06):** `p1-check-in.md` (and `p0-danger.md`) say "Suggestions to talk with {{other_person}} are switched off." For an operator or feedback flag the app never switched them off (`contact_actions_suppressed: false`), so the sentence would break runbook §5 ("never claim the app did something it didn't"). Neither the runbook nor the templates README covers this. Handled by turning the sentence into a `[HUMAN: …]` line, which is a deviation from "fill only the placeholders".
3. **`ESCALATE NOW` in drill output:** the instructions require it as the first line in drills too, and the notification step "fires on that line". Nothing says whether the notifier watches `ops/safety/drills/`. If it does, drills page Maggie for real.
4. **`{{greeting}}`:** rule uses the profile's first name, but the flag schema has no first name and the agent has no profile access. Used "Hi," throughout.

## Drill result

| Flag | Expected severity | Assigned | Expected escalation | Assigned | Expected in-app | Assigned | Match |
|---|---|---|---|---|---|---|---|
| flg_drill_01 | P0 | P0 | P0 | P0 | true | pass (true) | yes |
| flg_drill_02 | P0 | P0 | P0 | P0 | true | pass (true) | yes |
| flg_drill_03 | P1 | P1 | P1 | P1 | true | pass (true) | yes |
| flg_drill_04 | P1 | P1 | P0 | P0 | false | FAIL (false) | yes |
| flg_drill_05 | P2 | P2 | P2 | P2 | true | not applicable (null) | in-app differs: fixture conflicts with runbook §2 |
| flg_drill_06 | P1 | P1 | P1 | P1 | null | not applicable (null) | yes |

**Overall: PASS.** Every severity and escalation matches, no P0 under-triaged, the one in-app defect (flg_drill_04) is escalated to P0, and no draft breaks runbook §5 (flg_drill_06 needed a `[HUMAN: …]` line to avoid a false claim). The flg_drill_05 in-app mismatch is a fixture error, not a triage error.
