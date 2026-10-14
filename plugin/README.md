# Within Astrology for Claude

Birth chart, timing, and relationship readings in Western and Vedic astrology, inside Claude.
Within calculates the chart (planet positions checked against Swiss Ephemeris, historical time
zones, Placidus houses, Lahiri ayanamsa, nakshatras, dashas, progressions) and returns its reviewed
interpretations; Claude writes a connected reading in Within's careful, non-fatalistic style.

## Use it

1. Add the plugin, then connect **Within** on the plugin's Connectors tab and sign in with your Within account (Google or Apple).
2. Ask things like "What's my birth chart like?", "What is the sky doing for me this week?", "Read my Vedic chart", "When does my Saturn return start?", or "How do my partner and I work together?"
3. Claude asks for your birth date, time (and how sure you are of it), and town.

Commands: `/within-astrology:birth-chart` and `/within-astrology:sky-today`.

**Free with a Within account:** chart overview (Sun, Moon, rising, Vedic Moon and nakshatra) and today's sky.
**Within members:** full natal readings in both traditions, timing (week, month, year ahead, cycles, progressions, dashas), relationship readings, and answers to your own questions. Membership is bought on the Within website, not in Claude.

## What it includes

- A skill, `within-reading`, that tells Claude how to gather birth details, which tool to use, and Within's writing rules (possibility language, no predictions of events, no compatibility scores, both traditions kept separate, safety first).
- The Within connector at `https://within-mcp.withinoracle.workers.dev/mcp` (read-only tools).

## Data

The connector sends the birth details you give Claude (date, time, town or coordinates) and, for
questions, your question text, to Within's server at within-mcp.withinoracle.workers.dev, which
calculates the chart and returns the reading. Within doesn't store or log birth details or
questions. Sign-in uses your Within account; the connector reads only whether you have a
membership. The plugin sends nothing anywhere else. Privacy policy: https://within-oracle.withinoracle.workers.dev/privacy/

Astrology here is a lens for reflection, not a prediction or professional advice.
