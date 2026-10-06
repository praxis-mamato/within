# Region resources

The app's resource list lives in `app/src/safety/resources.ts`. Every country sees its emergency number (where listed) and [Find A Helpline](https://findahelpline.com), a global directory of free crisis lines. The countries most likely to have the most sign-ups also list named crisis and domestic-abuse lines.

The person picks the country in the safety panel; until they do, it is guessed from the device's time zone and language, never from their birth place.

## Before G2: verify every entry

Every entry currently has `verified: null`. For each country:

1. Check each number and link against the operator's own website (not a list of lists).
2. For named lines, call or text to confirm it connects and the opening hours.
3. Set `verified` to the date checked, in the same commit as any correction.
4. Re-check every six months, and whenever a line announces a change.

Add a country's named lines once sign-ups from it justify it; until then, its emergency number and Find A Helpline cover it.
