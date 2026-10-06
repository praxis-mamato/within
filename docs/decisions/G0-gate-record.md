# Gate 0 record — decisions and prototype authorization
October 6, 2026 · Product owner and approver: Maggie Amato

Gate 0 (build spec §10) unlocks **E1, the clickable prototype**. It does not unlock anything that collects real data.

## Authorized

- **E1 prototype:** a clickable mobile web app on sample data covering every screen in build spec §5, with the D1–D9 fixes. Authorized by the product owner on Oct 6, 2026 ("I need to get a full prototype built after gate and agent are done").
- **Safety ops agent** for drills: `.claude/agents/safety-ops.md`.

## Conditions on the prototype

- Sample data only. A banner on every screen says so. Nothing is sent to a server or stored after the tab closes.
- All perspective text is marked illustrative, not a chart reading. No ephemeris is used or needed, so the Swiss Ephemeris license is not yet required.
- Use is limited to Stage 1 interviews and internal review.

## Decisions recorded at this gate

| # | Decision | Spec |
|---|---|---|
| 1 | Pillars live inside relationships; self-only users get a "You" space | D2, §5.4 |
| 2 | Replace relationship-continuation taglines | D4 |
| 3 | Swiss Ephemeris Professional License, bought before G2 | §3.4 |
| 4 | Maggie Amato is the combined Western + Vedic approver | §3.5 |
| 5 | Safety flags are triaged by the safety ops agent with Maggie as escalation | §8.4 |
| 6 | Rendering B landscape behind the in-app timeline | §2 |

## Safety agent status at this gate

- First drill: **PASS** (6/6). It produced 14 findings on templates and the runbook. All were fixed except finding 13, which is a policy decision (below).
- Second drill on the fixed templates: **PASS** (6/6), recorded in `ops/safety/drills/2026-10-06-rerun/`. Its 4 small findings were fixed.
- Before G2 the drill must pass again on **approved** templates with real region resources.

## Amendment, Oct 6, 2026: live charts and a public link

Authorized by the product owner ("the geographical location needs to be in there and we need a real live response from the open source astrology sources"; "make a public app link").

- **Birth place** is a real place search (49,025 towns, GeoNames data) with coordinates and the historical time zone for the birth date.
- **Charts are calculated live in the browser** with Astronomy Engine (MIT) plus Within's own houses, ayanamsa, nakshatra, and dasha code, tested against Swiss Ephemeris to within 0.01°.
- **People may now enter real birth details.** Nothing is stored or sent: there is no server, no browser storage, and no analytics. Closing the tab erases everything.
- **Interpretation text is still draft** and labeled so. It does not yet change with the placements; that needs approved templates (§3.5).
- **Public link:** GitHub Pages from this repo, once Pages is switched on.

## Amendment, Oct 6, 2026: accounts, payment, on-device data

Product owner decisions ("they should sso in or oauth via apple or google. we need to take payment as well, data should be stored locally on their app"):

- Sign-in with Apple and Google.
- Paid subscription (price not yet set). Building payment is authorized; charging real customers still needs the price decision and the store accounts.
- Personal data stays on the person's device. Servers hold only sign-in identity and subscription status.
- Open conflicts with the pilot design and the PRD are listed in `docs/next-features.md` (Group B, "Conflicts this creates").

## Amendment, Oct 6, 2026: launch decisions

1. Approve the template library up front instead of reviewing each reading.
2. Personal data stays on the device and syncs through the person's own iCloud or Google Drive. We host only sign-in, subscription status, and opt-in safety check-ins.
3. Native iOS and Android apps (Capacitor), with minimal hosting.
4. Price: $9.99 a month.
5. Launch in all countries (China mainland excluded pending an ICP filing), in English.

## Not authorized yet (needs G1/G2)

Collecting birth data on our servers (now ruled out by design), recruitment for the pilot, AI phrasing, charging real customers before template approval, privacy review, and store setup are complete.

## Open for the product owner before G2

- **PRD amendment** to §7/§10 for the single approver.
- **Out-of-hours P0 gap** (runbook §3): accept in writing that P0 flags between 10pm and 8am wait for morning, or fund overnight cover.
- PRD §13 items still open: launch geography and privacy review, third-party data and consent model, pilot budget and recruitment, brand clearance, and pricing.
