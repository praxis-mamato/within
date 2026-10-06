# Follow-up templates

All templates are **DRAFT** until Maggie approves them (status line at the top of each file). Every message is sent by a human; the agent only drafts.

## Placeholders

| Placeholder | Filled by | Rule |
|---|---|---|
| `{{greeting}}` | Agent | Always "Hi," (the agent can't see names). The approver may personalize it. |
| `{{other_person}}` | Agent | The flag's `nickname` if set, otherwise "the other person" |
| `{{region_emergency_number}}`, `{{region_crisis_line}}`, `{{region_dv_line}}`, `{{region_resources}}` | Agent | Copied verbatim from `ops/safety/resources/<region>.md`. If that file doesn't exist, write `[PLACEHOLDER: …]`. Never invent a number. |
| `[ONLY IF …:]` | Agent | Keep the sentence only when the condition holds on the flag; otherwise delete it. |
| `[HUMAN: …]` | Approver | Anything that depends on an action the agent can't see (e.g. whether a reading was removed). The agent leaves these in place. |
| `{{approver_name}}` | Agent | "Maggie" |

## Which template

| Situation | Template |
|---|---|
| P0, immediate danger | `p0-danger.md` |
| P0, self-harm | `p0-self-harm.md` |
| P1 (fear, coercion, control) | `p1-check-in.md` |
| P2 harmful or frightening reading | `p2-harmful-reading.md` |
| Escalated to P0 **only** because the in-app response failed | The template for the **content** severity. The approver reviews it in the P0 window, because this message is the participant's first sight of the resources. |

## Before sending anything (P0/P1)

The other person may be able to read the participant's phone, email or notifications (e.g. a flag that mentions phone checking). Send follow-ups inside the app only, never by email or a push notification that shows text, and keep the preview generic.
