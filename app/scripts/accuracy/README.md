# Accuracy audit

Checks Within's astronomy against Swiss Ephemeris, the reference used by professional astrology
software, on 400 pseudo-random births (1930–2024, latitudes 55°S–60°N, every longitude) and two
years of sky events.

```
AUDIT_OUT=/tmp/engine.json npx vitest run scripts/accuracy/dump.test.ts --dir .
pip install pyswisseph
python scripts/accuracy/compare.py /tmp/engine.json
```

## Result (October 2026)

| Check | Matches | Share |
|---|---|---|
| Planet longitude within 0.05° (Sun–Pluto, mean node) | 4400/4400 | 100% |
| Planet sign | 4400/4400 | 100% |
| Retrograde flag | 3200/3200 | 100% |
| Ascendant and Midheaven within 0.05° | 800/800 | 100% |
| Placidus cusps within 0.1° | 4800/4800 | 100% |
| Planet house | 3999/4000 | 99.97% |
| Lahiri ayanamsa within 0.01° | 400/400 | 100% |
| Moon nakshatra and pada | 399/400 | 99.75% |
| Transit exact date within 1 day | 1076/1080 | 99.63% |
| Saturn return passes within 6 days | 130/130 | 100% |
| New and Full Moon dates and signs | 100/100 | 100% |
| Retrograde and direct stations within 3 days | 23/23 | 100% |
| **All checks** | **23727/23733** | **99.97%** |

Largest planet error: 0.005° (about 18 arcseconds). The few misses are bodies sitting within a few
hundredths of a degree of a house cusp or nakshatra boundary, where a tiny difference flips the label.

The Oracle's question routing is tested separately in `src/content/oracleRouting.test.ts`: 96 of 96
real-world phrasings reach the right part of the engine (the test requires at least 90%).
