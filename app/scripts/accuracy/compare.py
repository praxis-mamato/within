import json, datetime as dt, swisseph as swe
import sys
E = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'engine.json'))
swe.set_ephe_path(None)
P = {'Sun': swe.SUN, 'Moon': swe.MOON, 'Mercury': swe.MERCURY, 'Venus': swe.VENUS, 'Mars': swe.MARS, 'Jupiter': swe.JUPITER, 'Saturn': swe.SATURN, 'Uranus': swe.URANUS, 'Neptune': swe.NEPTUNE, 'Pluto': swe.PLUTO, 'Node': swe.MEAN_NODE}
SIGNS = 'Aries Taurus Gemini Cancer Leo Virgo Libra Scorpio Sagittarius Capricorn Aquarius Pisces'.split()
NAK = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
def jd(iso):
    t = dt.datetime.fromisoformat(iso.replace('Z', '+00:00'))
    return swe.julday(t.year, t.month, t.day, t.hour + t.minute / 60 + t.second / 3600)
def d(a, b): return abs((a - b + 540) % 360 - 180)
def pos(j, b): return swe.calc_ut(j, P[b], swe.FLG_MOSEPH | swe.FLG_SPEED)[0]
def date_of(j):
    y, m, dd, h = swe.revjul(j); return dt.date(y, m, dd)
R = {}
def tally(k, ok): R.setdefault(k, [0, 0]); R[k][0] += ok; R[k][1] += 1
worst = {}
swe.set_sid_mode(swe.SIDM_LAHIRI)
for c in E['charts']:
    j = jd(c['utc'])
    for b, v in c['planets'].items():
        x = pos(j, b)
        err = d(v['lon'], x[0]); worst[b] = max(worst.get(b, 0), err)
        tally('planet longitude within 0.05°', err < 0.05)
        tally('planet sign', SIGNS[int(v['lon'] // 30)] == SIGNS[int(x[0] // 30)])
        if b not in ('Sun', 'Moon', 'Node'): tally('retrograde flag', v['rx'] == (x[3] < 0))
    if c['cusps']:
        cusps, ascmc = swe.houses(j, c['lat'], c['lon'], b'P')
        tally('ascendant within 0.05°', d(c['asc'], ascmc[0]) < 0.05)
        tally('midheaven within 0.05°', d(c['mc'], ascmc[1]) < 0.05)
        for k in range(12): tally('Placidus cusp within 0.1°', d(c['cusps'][k], cusps[k]) < 0.1)
        for b, v in c['planets'].items():
            if v['house']:
                lon = pos(j, b)[0]; h = None
                for k in range(12):
                    a0, a1 = cusps[k], cusps[(k + 1) % 12]
                    if (lon - a0) % 360 < (a1 - a0) % 360: h = k + 1
                tally('planet house', h == v['house'])
    ay = swe.get_ayanamsa_ut(j)
    tally('Lahiri ayanamsa within 0.01°', abs(ay - c['ayanamsa']) < 0.01)
    sm = (pos(j, 'Moon')[0] - ay) % 360
    tally('Moon nakshatra and pada', NAK[int(sm // (360 / 27))] == c['nakshatra'] and int((sm % (360 / 27)) // (360 / 108)) + 1 == c['pada'])
    for x in c['contacts']:
        ang = {'conjunct': 0, 'sextile': 60, 'square': 90, 'trine': 120, 'opposite': 180}[x['aspect']]
        j0 = jd(x['date'] + 'T12:00:00Z'); best = None
        for h in range(-96, 97):
            jj = j0 + h / 24; o = abs(d(pos(jj, x['mover'])[0], x['natalLon']) - ang)
            if best is None or o < best[0]: best = (o, jj)
        tally('transit date within 1 day', abs((date_of(best[1]) - dt.date.fromisoformat(x['date'])).days) <= 1)
    if c['saturnReturn']:
        nat = c['planets']['Saturn']['lon']
        for p in c['saturnReturn']:
            j0 = jd(p + 'T12:00:00Z'); best = None
            for h in range(-15, 16):
                o = d(pos(j0 + h, 'Saturn')[0], nat)
                if best is None or o < best[0]: best = (o, h)
            tally('Saturn return pass within 6 days', abs(best[1]) <= 6 and best[0] < 0.2)
# Lunations
for l in E['lunar']:
    j0 = jd(l['date'] + 'T12:00:00Z'); target = 0 if l['kind'] == 'New Moon' else 180; best = None
    for h in range(-72, 73):
        jj = j0 + h / 24; e = d((pos(jj, 'Moon')[0] - pos(jj, 'Sun')[0]) % 360, target)
        if best is None or e < best[0]: best = (e, jj)
    tally('New/Full Moon date within 1 day', abs((date_of(best[1]) - dt.date.fromisoformat(l['date'])).days) <= 1)
    tally('New/Full Moon sign', SIGNS[int(pos(best[1], 'Moon')[0] // 30)] == l['sign'])
for s in E['stations']:
    j0 = jd(s['date'] + 'T12:00:00Z'); found = False
    for k in range(-3, 4):
        if (pos(j0 + k - 0.5, s['body'])[3] >= 0) != (pos(j0 + k + 0.5, s['body'])[3] >= 0): found = True
    tally('station within 3 days', found)
tot = [0, 0]
for k, (a, n) in R.items():
    print(f'{k:40s} {a:6d}/{n:<6d} {100*a/n:6.2f}%'); tot[0] += a; tot[1] += n
print(f"{'ALL CHECKS':40s} {tot[0]:6d}/{tot[1]:<6d} {100*tot[0]/tot[1]:6.2f}%")
print('worst planet error (degrees):', {k: round(v, 4) for k, v in worst.items()})
