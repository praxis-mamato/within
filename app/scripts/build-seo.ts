/**
 * Search pages, generated after the app build into dist/: plain HTML that search engines can read
 * without running the app. The Moon calendar and retrograde dates are computed by the same engine the
 * app uses, so they stay current with every build. Also writes the privacy policy and the sitemap.
 * Run with: vite-node scripts/build-seo.ts (part of npm run build).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as Astronomy from 'astronomy-engine';
import { SIGNS, tropicalLongitude } from '../src/astro/chart';
import { SIGN_ELEMENT, VEDIC_RASHI, WESTERN_SIGN } from '../src/content/templates';
import { PLANET_IN_SIGN, RISING, RULER, SIGN_KEYWORD, SIGN_MODALITY } from '../src/content/western';
import { PLANET_HIGH, PLANET_LOW } from '../src/content/energy';
import { computeNatal, type BirthInput } from '../src/astro/natal';
import { consultOracle } from '../src/content/oracleEngine';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const DIST = join(root, 'dist');
const env = readFileSync(join(root, '.env.production'), 'utf8');
const SITE = (/^VITE_SITE_URL=(.+)$/m.exec(env)?.[1] ?? '').trim().replace(/\/?$/, '/');
/** Public contact email for the privacy page (VITE_CONTACT_EMAIL in .env.production). */
const CONTACT = (/^VITE_CONTACT_EMAIL=(.+)$/m.exec(env)?.[1] ?? '').trim();
const SB_URL = (/^VITE_SUPABASE_URL=(.+)$/m.exec(env)?.[1] ?? '').trim();
const SB_ANON = (/^VITE_SUPABASE_ANON_KEY=(.+)$/m.exec(env)?.[1] ?? '').trim();
const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);
const Y = NOW.getUTCFullYear();
const DAY = 86400000;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const signOf = (lon: number) => SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
const slug = (s: string) => s.toLowerCase();

/** Reviews the owner approved and the writer agreed to show. Empty if the database can't be reached. */
async function approvedReviews(): Promise<{ rating: number; body: string; name: string | null; free_access: boolean }[]> {
  if (!SB_URL || !SB_ANON) return [];
  try {
    const res = await fetch(`${SB_URL}/rest/v1/reviews?select=rating,body,name,free_access&order=created_at.desc&limit=12`, { headers: { apikey: SB_ANON, authorization: `Bearer ${SB_ANON}` } });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
const REVIEWS = await approvedReviews();
/** Real Oracle answers for three example charts, computed at build time. Labelled as examples. */
const EXAMPLES: { who: string; b: BirthInput; q: string }[] = [
  { who: 'born 22 Mar 1990, 8:15 am, New York', b: { date: '1990-03-22', time: '08:15', timePrecision: 'exact', windowMinutes: 0, lat: 40.7128, lon: -74.006, tz: 'America/New_York' }, q: 'When should I ask for a raise?' },
  { who: 'born 14 Jul 1985, 6:30 am, Pune', b: { date: '1985-07-14', time: '06:30', timePrecision: 'exact', windowMinutes: 0, lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata' }, q: 'Should I start my own business?' },
  { who: 'born 2 Nov 1996, 9:40 pm, London', b: { date: '1996-11-02', time: '21:40', timePrecision: 'exact', windowMinutes: 0, lat: 51.5074, lon: -0.1278, tz: 'Europe/London' }, q: 'What do I need in love?' },
];
const examplesHtml = (n: number, style = '') =>
  `<section class="examples"${style}><h2>See what the Oracle says</h2><p class="fine" style="text-align:left">Real answers for example charts, asked ${fmt(NOW)}. Yours come from your own chart.</p>${EXAMPLES.slice(0, n)
    .map((e) => {
      const r = consultOracle(e.q, { chart: computeNatal(e.b), place: { lat: e.b.lat, lon: e.b.lon } });
      return `<blockquote><p><strong>“${esc(e.q)}”</strong></p><p class="fine" style="text-align:left;margin:0 0 8px">Example chart: ${esc(e.who)}</p><p><strong>${esc(r.label)}</strong></p>${r.lines
        .slice(0, 3)
        .map((l) => `<p>${l.heading ? `<strong>${esc(l.heading)}:</strong> ` : ''}${esc(l.text)}</p>`)
        .join('')}</blockquote>`;
    })
    .join('')}</section>`;

const PROOF = ['Matched against Swiss Ephemeris on 99.97% of checks', 'Western and Vedic in one chart, from your exact birth time', '1,780 reviewed interpretations behind every answer', 'Your chart and questions stay on your phone'];
const reviewsHtml = (style = '') =>
  REVIEWS.length
    ? `<section class="reviews"${style}><h2>What people say</h2>${REVIEWS.map((r) => `<blockquote><p class="stars-row" aria-label="${r.rating} of 5 stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</p><p>${esc(r.body)}</p><footer>${esc(r.name || 'A Within member')}${r.free_access ? ' · received free access' : ''}</footer></blockquote>`).join('')}</section>`
    : '';
const proofHtml = (style = '') => `<ul class="proof"${style}>${PROOF.map((x) => `<li>${x}</li>`).join('')}</ul>`;

interface Page {
  path: string;
  title: string;
  description: string;
  h1: string;
  body: string;
  ld?: object[];
  /** Leave out reviews and the proof strip (the privacy policy). */
  plain?: boolean;
}
const pages: Page[] = [];

const NAV: [string, string][] = [
  ['birth-chart/', 'Birth chart'],
  ['synastry/', 'Synastry'],
  ['moon-calendar/', 'Moon calendar'],
  ['mercury-retrograde/', 'Mercury retrograde'],
  ['retrogrades/', 'Retrogrades'],
  ['zodiac/', 'Zodiac signs'],
];

function cta(text = 'Ask the Oracle, free') {
  return `<p class="cta"><a class="btn" href="${SITE}">${esc(text)}</a></p><p class="fine">Free to start · 30 seconds · your chart stays on your phone</p>`;
}

function render(p: Page) {
  const url = SITE + p.path;
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Within', item: SITE }, ...(p.path ? [{ '@type': 'ListItem', position: 2, name: p.h1, item: url }] : [])] };
  const ld = [crumbs, ...(p.ld ?? [])].map((x) => `<script type="application/ld+json">${JSON.stringify(x).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Within" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}og.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="theme-color" content="#0a0f26" />
<link rel="icon" href="${SITE}icon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet" />
<style>
body{margin:0;background:#0a0f26;color:#f1e6d8;font:17px/1.6 'Source Sans 3',system-ui,sans-serif}
.wrap{max-width:720px;margin:0 auto;padding:24px 16px 64px}
header{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;margin-bottom:24px}
header a.home{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#fff6e6;text-decoration:none}
nav{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.9rem}
a{color:#e9c48a}
h1,h2,h3{font-family:'Cormorant Garamond',serif;color:#fff6e6;line-height:1.15}
h1{font-size:2.3rem;margin:.2em 0 .4em}
h2{font-size:1.6rem;margin:1.6em 0 .4em}
h3{font-size:1.25rem;margin:1.2em 0 .3em}
.lede{font-size:1.15rem;color:#e7d8ea}
.tbl{width:100%;border-collapse:collapse;font-size:.95rem}
.tbl th,.tbl td{text-align:left;padding:8px 6px;border-bottom:1px solid rgba(226,194,126,.2);vertical-align:top}
.tbl th{color:#cdb9c6;font-weight:600}
.scroll{overflow-x:auto}
.cta{text-align:center;margin:32px 0 6px}
.btn{display:inline-block;padding:14px 36px;border-radius:999px;background:linear-gradient(180deg,#e9b56c,#c98b4a);color:#24122a;font-weight:600;text-decoration:none}
.fine{text-align:center;font-size:.85rem;color:#cdb9c6}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:0;list-style:none}
.grid a{display:block;padding:12px;border:1px solid rgba(226,194,126,.35);border-radius:12px;text-decoration:none}
blockquote{margin:16px 0;padding:14px 16px;border-left:3px solid #e2c27e;background:rgba(255,255,255,.04);border-radius:0 12px 12px 0}
blockquote footer{margin:6px 0 0;color:#cdb9c6;font-size:.9rem}
.stars-row{color:#e2c27e;letter-spacing:2px;margin:0 0 4px}
.proof{list-style:none;padding:0;margin:32px 0 0;display:grid;gap:8px;font-size:.95rem;color:#e7d8ea}
.proof li::before{content:'✦ ';color:#e2c27e}
footer{margin-top:48px;font-size:.85rem;color:#a99bb0}
</style>
${ld}
</head>
<body>
<div class="wrap">
<header><a class="home" href="${SITE}">Within · The Oracle</a><nav>${NAV.map(([h, t]) => `<a href="${SITE}${h}">${t}</a>`).join('')}</nav></header>
<main>
<h1>${esc(p.h1)}</h1>
${p.body}
${p.plain ? '' : reviewsHtml() + proofHtml()}
</main>
<footer><p>Within reads your exact birth chart, Western and Vedic, matched against Swiss Ephemeris on 99.97% of checks. Astrology for reflection, not prediction.</p><p><a href="${SITE}learn/">All guides</a> · <a href="${SITE}privacy/">Privacy</a></p></footer>
</div>
</body>
</html>
`;
}

// ---------- Moon calendar ----------
function moonCalendar() {
  const rows: string[] = [];
  const end = new Date(NOW.getTime() + 380 * DAY);
  const events: { t: Date; kind: string; sign: string }[] = [];
  for (const [angle, kind] of [[0, 'New Moon'], [180, 'Full Moon']] as const) {
    let t = Astronomy.SearchMoonPhase(angle, NOW, 40);
    while (t && t.date < end) {
      events.push({ t: t.date, kind, sign: signOf(tropicalLongitude('Moon', t.date)) });
      t = Astronomy.SearchMoonPhase(angle, new Date(t.date.getTime() + DAY), 40);
    }
  }
  const eclipses: { t: Date; kind: string; sign: string }[] = [];
  let le = Astronomy.SearchLunarEclipse(NOW);
  while (le.peak.date < end) {
    eclipses.push({ t: le.peak.date, kind: `${cap(le.kind)} lunar eclipse`, sign: signOf(tropicalLongitude('Moon', le.peak.date)) });
    le = Astronomy.NextLunarEclipse(le.peak);
  }
  let se = Astronomy.SearchGlobalSolarEclipse(NOW);
  while (se.peak.date < end) {
    eclipses.push({ t: se.peak.date, kind: `${cap(se.kind)} solar eclipse`, sign: signOf(tropicalLongitude('Sun', se.peak.date)) });
    se = Astronomy.NextGlobalSolarEclipse(se.peak);
  }
  events.sort((a, b) => +a.t - +b.t);
  eclipses.sort((a, b) => +a.t - +b.t);
  for (const e of events) {
    const ecl = eclipses.find((x) => Math.abs(+x.t - +e.t) < 2 * DAY);
    rows.push(`<tr><td>${fmt(e.t)}</td><td>${fmtTime(e.t)} UTC</td><td>${e.kind}${ecl ? ` · <strong>${ecl.kind}</strong>` : ''}</td><td>${e.sign}</td></tr>`);
  }
  const first = events[0];
  const yrs = `${Y}–${Y + 1}`;
  pages.push({
    path: 'moon-calendar/',
    title: `New Moon and Full Moon calendar ${yrs}: dates, signs and eclipses | Within`,
    description: `Every New Moon and Full Moon from ${fmt(NOW)} for the next year, with exact times, zodiac signs, and solar and lunar eclipses. Calculated from astronomical data.`,
    h1: `Moon calendar ${yrs}`,
    body: `<p class="lede">Every New Moon and Full Moon for the next twelve months, with the exact time and the sign the Moon is in. Eclipses are marked. Times are in UTC; your local date may differ by a day.</p>
<p>The next ${first.kind} is on <strong>${fmt(first.t)}</strong> in ${first.sign}.</p>
<div class="scroll"><table class="tbl"><thead><tr><th>Date</th><th>Time</th><th>Phase</th><th>Sign</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
<h2>Eclipses in the next year</h2>
<ul>${eclipses.map((e) => `<li><strong>${fmt(e.t)}</strong>: ${e.kind} in ${e.sign}</li>`).join('')}</ul>
<h2>How to use the New and Full Moon</h2>
<p><strong>New Moon:</strong> the Sun and Moon meet. Tradition reads it as a time to begin: set an intention, start a habit, plant something. <strong>Full Moon:</strong> the Moon opposes the Sun. It is a time when what you started comes to light: a good moment to finish, celebrate, or let go.</p>
<p>What a New Moon means for you depends on where it falls in your own chart. A New Moon in ${first.sign} lights up a different part of life for each person. Within maps every phase onto your chart and can add it to your calendar.</p>
${cta('See the Moon in your chart')}`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: `Moon calendar ${yrs}`, dateModified: TODAY, author: { '@type': 'Organization', name: 'Within' } }],
  });
}

// ---------- Retrogrades ----------
function retrogrades() {
  const speed = (b: (typeof RX)[number], d: Date) => ((tropicalLongitude(b, new Date(+d + DAY / 2)) - tropicalLongitude(b, new Date(+d - DAY / 2)) + 540) % 360) - 180;
  const RX = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const;
  const MEANING: Record<string, string> = {
    Mercury: 'Communication, travel, and technology slow down. Tradition reads it as a time to review, revise, and reconnect, and to double-check plans before signing.',
    Venus: 'Love, money, and values turn inward. A time to reflect on what and whom you value; old flames and old spending habits often return to be looked at.',
    Mars: 'Drive and anger turn inward. Energy can feel stuck; it works best on finishing, repairing, and choosing your battles.',
    Jupiter: 'Growth turns inward. A time to review your beliefs and plans for expansion before pushing forward again.',
    Saturn: 'Responsibilities and limits are reviewed. A time to strengthen foundations and finish what you committed to.',
    Uranus: 'Change works quietly, inside. Freedom and new ideas incubate before they show.',
    Neptune: 'Illusions fade and dreams are reviewed. A clearer look at what is real.',
    Pluto: 'Deep change works privately. Power, control, and what needs to end are reviewed.',
  };
  const periods: { body: string; start: Date; end: Date; from: string; to: string }[] = [];
  const begin = new Date(NOW.getTime() - 200 * DAY);
  const stop = new Date(NOW.getTime() + 560 * DAY);
  for (const b of RX) {
    let prev = speed(b, begin);
    let start: Date | null = null;
    for (let t = +begin + DAY; t <= +stop; t += DAY) {
      const d = new Date(t);
      const s = speed(b, d);
      if (prev >= 0 && s < 0) start = d;
      if (prev < 0 && s >= 0 && start) {
        if (d >= NOW) periods.push({ body: b, start, end: d, from: signOf(tropicalLongitude(b, start)), to: signOf(tropicalLongitude(b, d)) });
        start = null;
      }
      prev = s;
    }
  }
  periods.sort((a, b) => +a.start - +b.start);
  const yrs = `${Y} and ${Y + 1}`;
  const merc = periods.filter((p) => p.body === 'Mercury');
  const row = (p: (typeof periods)[number]) => `<tr><td>${p.body}</td><td>${fmt(p.start)}</td><td>${fmt(p.end)}</td><td>${p.from === p.to ? p.from : `${p.from} → ${p.to}`}</td></tr>`;
  pages.push({
    path: 'retrogrades/',
    title: `Mercury retrograde ${yrs}: every retrograde date | Within`,
    description: `Mercury, Venus, Mars and outer planet retrograde dates for ${yrs}, with the signs they move through and what each retrograde means. Calculated from astronomical data.`,
    h1: `Retrograde dates ${yrs}`,
    body: `<p class="lede">Every planet retrograde from now through the next eighteen months: when it starts, when it turns direct, and the sign it moves through.</p>
${merc[0] ? `<p>${merc[0].start < NOW ? 'Mercury is retrograde now, until' : 'The next Mercury retrograde runs from'} ${merc[0].start < NOW ? `<strong>${fmt(merc[0].end)}</strong>` : `<strong>${fmt(merc[0].start)}</strong> to <strong>${fmt(merc[0].end)}</strong>`} in ${merc[0].from === merc[0].to ? merc[0].from : `${merc[0].from} and ${merc[0].to}`}.</p>` : ''}
<p><a href="${SITE}mercury-retrograde/">The next Mercury retrograde: shadow dates and what it means for your rising sign</a></p>
<h2>Mercury retrograde dates</h2>
<div class="scroll"><table class="tbl"><thead><tr><th>Planet</th><th>Turns retrograde</th><th>Turns direct</th><th>Sign</th></tr></thead><tbody>${merc.map(row).join('')}</tbody></table></div>
<h2>All retrogrades</h2>
<div class="scroll"><table class="tbl"><thead><tr><th>Planet</th><th>Turns retrograde</th><th>Turns direct</th><th>Sign</th></tr></thead><tbody>${periods.map(row).join('')}</tbody></table></div>
<h2>What each retrograde means</h2>
${RX.map((b) => `<h3>${b} retrograde</h3><p>${MEANING[b]}</p>`).join('')}
<h2>What a retrograde means for you</h2>
<p>A retrograde touches each person differently, depending on which part of your birth chart the planet moves through and whether you were born with it retrograde. Within shows the retrogrades in your own chart and what to do with them.</p>
${cta('See retrogrades in your chart')}`,
    ld: [{ '@context': 'https://schema.org', '@type': 'Article', headline: `Retrograde dates ${yrs}`, dateModified: TODAY, author: { '@type': 'Organization', name: 'Within' } }],
  });
}

// ---------- Mercury retrograde (the current or next one, with shadow dates and a house for each rising sign) ----------
function mercuryRetrograde() {
  const speed = (b: 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto', d: Date) => ((tropicalLongitude(b, new Date(+d + DAY / 2)) - tropicalLongitude(b, new Date(+d - DAY / 2)) + 540) % 360) - 180;
  const HOUR = DAY / 24;
  // Walk back if Mercury is already retrograde, so the page covers the current period.
  let t = +NOW;
  while (speed('Mercury', new Date(t)) < 0) t -= HOUR;
  let start: Date | null = null;
  let end: Date | null = null;
  for (; t < +NOW + 200 * DAY; t += HOUR) {
    const s = speed('Mercury', new Date(t));
    if (!start && s < 0) start = new Date(t);
    if (start && s >= 0) {
      end = new Date(t);
      break;
    }
  }
  if (!start || !end) return;
  const lonStart = tropicalLongitude('Mercury', start);
  const lonEnd = tropicalLongitude('Mercury', end);
  const deg = (l: number) => `${Math.floor(((l % 30) + 30) % 30)}°`;
  const from = signOf(lonStart);
  const to = signOf(lonEnd);
  const where = from === to ? from : `${to} and ${from}`;
  const ahead = (a: number, b: number) => ((a - b + 540) % 360) - 180;
  // Shadow: Mercury first reaches the degree it later turns direct at, and later returns to the degree it turned retrograde at.
  let pre = start;
  for (let x = +start; x > +start - 40 * DAY; x -= HOUR) {
    if (ahead(tropicalLongitude('Mercury', new Date(x)), lonEnd) < 0) break;
    pre = new Date(x);
  }
  let post = end;
  for (let x = +end; x < +end + 40 * DAY; x += HOUR) {
    post = new Date(x);
    if (ahead(tropicalLongitude('Mercury', new Date(x)), lonStart) >= 0) break;
  }
  const others = (['Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'] as const).filter((b) => {
    for (let x = +start!; x <= +end!; x += DAY) if (speed(b, new Date(x)) < 0) return true;
    return false;
  });
  const month = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  const HOUSE: string[] = [
    'how you come across, your body and first impressions. A time to rethink how you present yourself.',
    'money you earn and what you value. Review budgets, prices and subscriptions before you commit.',
    'conversations, siblings, short trips and paperwork. Reread messages before you send them.',
    'home and family. Old family topics may resurface; repairs and moves deserve a second check.',
    'romance, creativity and play. An old creative project or an old flame may return to be looked at.',
    'daily work, routines and health habits. A good time to fix systems that keep slipping.',
    'partners and close one-to-one ties. Conversations may circle back to unfinished business.',
    'shared money, trust and intimacy. Review joint finances, debts and agreements.',
    'study, travel and beliefs. Double-check bookings; revisit a course or idea you set aside.',
    'career and public role. Revise plans and applications before you launch them.',
    'friends, groups and hopes. Reconnect with people you lost touch with.',
    'rest, the inner life and what is hidden. A time to slow down, reflect and sleep on decisions.',
  ];
  const idx = SIGNS.indexOf(from);
  const faqs: [string, string][] = [
    [`When is Mercury retrograde in ${month}?`, `Mercury turns retrograde on ${fmt(start)} at ${deg(lonStart)} ${from} and turns direct on ${fmt(end)} at ${deg(lonEnd)} ${to}. The shadow period runs from ${fmt(pre)} to ${fmt(post)}.`],
    ['What is the Mercury retrograde shadow?', `The shadow is the stretch of sky Mercury crosses three times. It enters on ${short(pre)}, before the retrograde, and leaves on ${short(post)}, once Mercury has made up the ground it retraced. Tradition reads the pre-shadow as a preview and the post-shadow as the time to finish what the retrograde brought up.`],
    ['Is Mercury retrograde real?', 'Mercury does not reverse. Seen from Earth, it appears to move backward for about three weeks, three or four times a year, because Earth and Mercury move at different speeds. The dates on this page are calculated from astronomical data.'],
    ['What should I avoid during Mercury retrograde?', 'Tradition advises care rather than fear: back up your phone, reread contracts, double-check travel and messages, and give big decisions an extra day. It favors the “re-” words: review, revise, repair, reconnect.'],
    [`What does Mercury retrograde in ${from} mean?`, `${from} is a sign of ${SIGN_KEYWORD[from]}. ${PLANET_IN_SIGN.Mercury[from]} With Mercury retrograde here, tradition reads it as a time to look again at these themes.`],
  ];
  pages.push({
    path: 'mercury-retrograde/',
    title: `Mercury retrograde ${month} in ${where}: dates, shadow and what it means | Within`,
    description: `Mercury is retrograde from ${short(start)} to ${short(end)}, in ${where}. Exact dates, the shadow period, what it means for your rising sign, and what to do. Calculated from astronomical data.`,
    h1: `Mercury retrograde, ${short(start)} to ${short(end)}`,
    body: `<p class="lede">${start < NOW ? 'Mercury is retrograde now' : 'The next Mercury retrograde begins'} in ${where}. Here are the exact dates, the shadow period on either side, and what it touches in your own chart.</p>
<div class="scroll"><table class="tbl"><tbody>
<tr><th>Shadow begins</th><td>${fmt(pre)}</td><td>Mercury first crosses ${deg(lonEnd)} ${to}</td></tr>
<tr><th>Turns retrograde</th><td>${fmt(start)}</td><td>${deg(lonStart)} ${from}</td></tr>
<tr><th>Turns direct</th><td>${fmt(end)}</td><td>${deg(lonEnd)} ${to}</td></tr>
<tr><th>Shadow ends</th><td>${fmt(post)}</td><td>Mercury returns to ${deg(lonStart)} ${from}</td></tr>
</tbody></table></div>
${others.length ? `<p>Also retrograde during this period: <strong>${others.join(', ')}</strong>. See <a href="${SITE}retrogrades/">every retrograde date</a>.</p>` : ''}
<h2>What Mercury retrograde in ${from} is about</h2>
<p>Mercury rules thinking, talking, messages, travel and technology. ${from} is a sign of ${SIGN_KEYWORD[from]}. ${PLANET_IN_SIGN.Mercury[from]} When Mercury retrogrades here, tradition reads it as a time to look again at these themes: what is under the surface, what you have not said, and what you share with others.</p>
<h2>What to do</h2>
<ul><li><strong>Review before you sign.</strong> Reread contracts, terms and offers; ask the extra question.</li>
<li><strong>Back up.</strong> Phones, photos and files, before ${short(start)}.</li>
<li><strong>Double-check travel.</strong> Times, bookings and addresses.</li>
<li><strong>Finish, repair, return.</strong> Edit the draft, fix the system, reply to the old message.</li>
<li><strong>Sleep on big decisions.</strong> Many astrologers prefer to launch new things after ${short(end)}, or after the shadow ends on ${short(post)}.</li></ul>
<h2>Mercury retrograde by rising sign</h2>
<p>Where this retrograde lands depends on your rising sign: it moves through one house of your chart. Find yours (whole-sign houses):</p>
${SIGNS.map((r, i) => `<h3>${r} rising</h3><p>Your ${['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'][(idx - i + 12) % 12]} house: ${HOUSE[(idx - i + 12) % 12]}</p>`).join('')}
<p>Don’t know your rising sign? It needs your birth time. Within works it out in seconds, then shows the exact degree this retrograde touches in your chart and the dates that matter for you.</p>
${cta('See this retrograde in your chart')}
<h2>Questions</h2>${faqs.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('')}`,
    ld: [
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      { '@context': 'https://schema.org', '@type': 'Article', headline: `Mercury retrograde ${month}`, dateModified: TODAY, author: { '@type': 'Organization', name: 'Within' } },
    ],
  });
}

// ---------- Zodiac signs ----------
function zodiac() {
  for (const s of SIGNS) {
    const w = WESTERN_SIGN[s];
    const v = VEDIC_RASHI[s];
    const ruler = RULER[s];
    const faqs: [string, string][] = [
      [`What is ${s} known for?`, `${s} is a ${SIGN_MODALITY[s]} ${SIGN_ELEMENT[s]} sign ruled by ${ruler}, linked with ${SIGN_KEYWORD[s]}. Its core quality is ${w.core}.`],
      [`What does a ${s} Moon mean?`, PLANET_IN_SIGN.Moon[s]],
      [`What does ${s} rising mean?`, RISING[s]],
      [`How does ${s} love?`, PLANET_IN_SIGN.Venus[s]],
    ];
    pages.push({
      path: `zodiac/${slug(s)}/`,
      title: `${s} meaning: personality, love, Moon and rising | Within`,
      description: `${s} in astrology: a ${SIGN_ELEMENT[s]} sign of ${SIGN_KEYWORD[s]}. What ${s} means as your Sun, Moon, rising and Venus sign, in Western and Vedic astrology.`,
      h1: `${s}: the sign of ${SIGN_KEYWORD[s]}`,
      body: `<p class="lede">${s} is a ${SIGN_MODALITY[s]} ${SIGN_ELEMENT[s]} sign, ruled by ${ruler}. Its core quality is ${w.core}: it connects ${w.connect}, and speaks ${w.speak}.</p>
<h2>${s} Sun</h2><p>${PLANET_IN_SIGN.Sun[s]}</p>
<h2>${s} Moon</h2><p>${PLANET_IN_SIGN.Moon[s]} A ${s} Moon needs ${w.need}.</p>
<h2>${s} rising</h2><p>${RISING[s]}</p>
<h2>${s} in love</h2><p>${PLANET_IN_SIGN.Venus[s]}</p>
<h2>${s} Mercury and Mars</h2><p>${PLANET_IN_SIGN.Mercury[s]} ${PLANET_IN_SIGN.Mars[s]}</p>
<h2>At its best and under strain</h2><p>${ruler} rules ${s}. At its best, ${ruler} is ${PLANET_HIGH[ruler]}. Under strain, it can be ${PLANET_LOW[ruler]}.</p>
<h2>${s} in Vedic astrology</h2><p>In the Vedic (sidereal) zodiac, the Moon in this rashi gives ${v.mind}, with ${v.love}. Its approach to life is ${v.approach}. Because the sidereal zodiac sits about 24° behind the tropical one, many people with a ${s} Sun have a different Vedic Sun sign.</p>
<h2>More than your Sun sign</h2><p>Your Sun sign is one of more than a dozen placements in your chart. Within reads all of them, Western and Vedic, from your exact birth time and place.</p>
${cta(`Read my whole chart`)}
<h2>Other signs</h2><ul class="grid">${SIGNS.filter((x) => x !== s).map((x) => `<li><a href="${SITE}zodiac/${slug(x)}/">${x}</a></li>`).join('')}</ul>`,
      ld: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
    });
  }
  pages.push({
    path: 'zodiac/',
    title: 'The 12 zodiac signs: meanings, elements and rulers | Within',
    description: 'All twelve zodiac signs: their elements, modalities, ruling planets, and what each means as your Sun, Moon, rising and Venus sign.',
    h1: 'The twelve zodiac signs',
    body: `<p class="lede">Each sign describes a way of being. Your chart holds many of them at once: your Sun, Moon, rising, and every planet sits in a sign.</p>
<div class="scroll"><table class="tbl"><thead><tr><th>Sign</th><th>Element</th><th>Mode</th><th>Ruler</th><th>Theme</th></tr></thead><tbody>${SIGNS.map((s) => `<tr><td><a href="${SITE}zodiac/${slug(s)}/">${s}</a></td><td>${cap(SIGN_ELEMENT[s])}</td><td>${cap(SIGN_MODALITY[s])}</td><td>${RULER[s]}</td><td>${SIGN_KEYWORD[s]}</td></tr>`).join('')}</tbody></table></div>
${cta('Find your signs')}`,
  });
}

// ---------- Guides ----------
function guides() {
  const faqLd = (faqs: [string, string][]) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const bc: [string, string][] = [
    ['What do I need for a birth chart?', 'Your birth date, birth place, and ideally your birth time. Without a time, your Sun, planets and most aspects are still exact; the rising sign and houses need the time.'],
    ['What is the difference between Western and Vedic astrology?', 'Western astrology uses the tropical zodiac, tied to the seasons. Vedic (Jyotish) uses the sidereal zodiac, tied to the stars, about 24° behind. Vedic adds nakshatras (lunar mansions) and dashas (planetary periods).'],
    ['How accurate is Within?', 'Planet positions are checked against Swiss Ephemeris, the professional standard, and match on 99.97% of checks, with the largest planet difference under 0.01°.'],
    ['Is my birth data stored on a server?', 'No. Your birth details, chart and readings stay on your phone.'],
  ];
  pages.push({
    path: 'birth-chart/',
    title: 'Free birth chart reading: Western and Vedic, from your exact birth time | Within',
    description: 'A free birth chart reading from your exact birth date, time and place: Sun, Moon, rising, houses, aspects, nakshatra and dashas. Ask the Oracle anything about your chart.',
    h1: 'Your birth chart, read in full',
    body: `<p class="lede">Your birth chart is a map of the sky at the moment you were born. Within reads it in both great traditions, Western and Vedic, and answers your questions from it in plain words.</p>
<h2>What your chart shows</h2>
<ul><li><strong>Sun, Moon and rising:</strong> who you are, what you need, and how you meet the world.</li>
<li><strong>Planets in signs and houses:</strong> how each part of you works, and the area of life it acts in.</li>
<li><strong>Aspects:</strong> where your chart holds tension (squares, oppositions) and where energy flows (trines, sextiles), and how to work with each.</li>
<li><strong>Nakshatra and dashas (Vedic):</strong> your Moon’s lunar mansion and the planetary period you are living in now.</li>
<li><strong>Transits and progressions:</strong> what the sky is setting off in your chart this week, this month and this year.</li></ul>
${examplesHtml(3)}
<h2>Ask it anything</h2>
<p>“When should I ask for a raise?” “Why do I keep choosing the same kind of partner?” “What’s my rising sign?” The Oracle answers from your exact chart, with the dates that matter for you.</p>
${cta('Read my chart, free')}
<h2>Questions</h2>${bc.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('')}`,
    ld: [faqLd(bc)],
  });
  const syn: [string, string][] = [
    ['What is a synastry chart?', 'A synastry chart lays two birth charts over each other to show how two people’s planets interact: where they spark, soothe, challenge and grow each other.'],
    ['What is a composite chart?', 'A composite chart blends two charts into one, using the midpoints of each pair of planets. It describes the relationship itself, as its own entity.'],
    ['Does synastry tell me if we are compatible?', 'Synastry shows dynamics, not a verdict. Within does not give compatibility scores; it shows where the connection flows, where it asks for work, and what timing is active between you.'],
    ['Does it work for friends, family and work?', 'Yes. Synastry describes any relationship. Add as many people as you like; their details stay on your phone.'],
  ];
  pages.push({
    path: 'synastry/',
    title: 'Synastry chart: relationship astrology for two birth charts | Within',
    description: 'Free synastry chart: compare two birth charts. Aspects between you, house overlays, composite and Davison charts, progressed synastry, and Vedic kootas.',
    h1: 'Synastry: the astrology between two people',
    body: `<p class="lede">Lay two birth charts together and the relationship comes into view: what draws you in, where you rub, and what the two of you are working on right now.</p>
<h2>What Within reads between two charts</h2>
<ul><li><strong>Cross-aspects:</strong> how each of your planets meets the other person’s.</li>
<li><strong>House overlays:</strong> which part of your life the other person lights up.</li>
<li><strong>Composite and Davison charts:</strong> the relationship as its own chart.</li>
<li><strong>Progressed synastry and timeline:</strong> how the connection changes, and the dates ahead.</li>
<li><strong>Vedic kootas:</strong> the traditional Indian comparison of two Moon signs, read as themes, never a score.</li></ul>
${cta('Compare two charts')}
<h2>Questions</h2>${syn.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('')}`,
    ld: [faqLd(syn)],
  });
  pages.push({
    path: 'learn/',
    title: 'Astrology guides: birth charts, synastry, Moon and retrogrades | Within',
    description: 'Guides to your birth chart, synastry, the Moon calendar, retrograde dates, and the twelve zodiac signs.',
    h1: 'Guides',
    body: `<ul class="grid">${[...NAV, ...SIGNS.map((s) => [`zodiac/${slug(s)}/`, s] as [string, string])].map(([h, t]) => `<li><a href="${SITE}${h}">${t}</a></li>`).join('')}</ul>${cta()}`,
  });
}

// ---------- Privacy ----------
/** The date the privacy policy last changed in substance. Update it when the policy changes. */
const PRIVACY_UPDATED = new Date('2026-10-14T12:00:00Z');

function privacy() {
  const ask = CONTACT ? `email <a href="mailto:${CONTACT}">${CONTACT}</a>` : 'use the contact email on our Google Play listing';
  pages.push({
    path: 'privacy/',
    plain: true,
    title: 'Privacy policy | Within',
    description: 'How Within handles your data: your birth details, chart, questions and journal stay on your device.',
    h1: 'Privacy policy',
    body: `<p class="lede">Effective ${fmt(PRIVACY_UPDATED)}. Within is built so your most personal information stays with you: your birth details, chart, questions and journal never leave your device.</p>
<p>This policy covers the Within website (${esc(SITE)}) and the Within Android app. “We” means Within.</p>
<h2>What stays on your device</h2>
<p>Your birth date, time and place; your chart; the people you add and their birth details; your questions to the Oracle and its answers; your readings, journal, milestones and reflections. These are stored only in your browser or app on your device. We do not receive them, and they are not used to train any model. You can export or erase them at any time in Settings.</p>
<h2>What we collect if you create an account</h2>
<p>You can use Within without an account. If you sign in, we store:</p>
<ul><li><strong>Account:</strong> your email address and sign-in provider (Google or Apple), to sign you in.</li>
<li><strong>Membership:</strong> your plan, its status and renewal date, and a Stripe customer reference.</li>
<li><strong>Usage counts:</strong> how many connected readings you have used each month, to apply plan limits.</li>
<li><strong>Live readings, only if you book one:</strong> your email, the package, your questions, availability, time zone, and the birth details you choose to share with your astrologer. Your astrologer sees these to prepare your sessions.</li></ul>
<h2>Connected readings</h2>
<p>If you turn on connected readings, Within sends your calculated placements to Anthropic’s Claude model to write the reading. Your name, birth details, journal and notes are never sent. Anthropic does not use this data to train its models. Connected readings are off until you turn them on, and you can turn them off in Settings.</p>
<h2>Within in Claude</h2>
<p>If you add the Within plugin to Claude and connect your Within account, the birth details you give Claude (date, time, and town or coordinates) and your questions are sent to Within’s server to calculate the chart and return the reading. They are used only for that request and are not stored or logged. The connection lets Claude see whether you have a membership, and nothing else in your account. Your conversation stays with Claude under Anthropic’s terms and your Claude settings. You can disconnect Within at any time in Claude’s connector settings.</p>
<h2>Optional usage and crash reports</h2>
<p>Off unless you turn them on in Settings. If on, we receive anonymous events, such as “reading opened”, and crash details, tied to a random install ID and never to your account or chart.</p>
<h2>Services we use</h2>
<ul><li><strong>Cloudflare</strong> hosts the website and app. Like any web host, it briefly processes your IP address and browser details to deliver pages and stop abuse.</li>
<li><strong>Supabase</strong> stores account, membership and booking records.</li>
<li><strong>Stripe</strong> processes payments. We never see or store your card number.</li>
<li><strong>Google and Apple</strong> handle sign-in if you choose them.</li>
<li><strong>Anthropic</strong> writes connected readings, only if you turn them on.</li>
<li><strong>Cloudflare</strong> also runs the Within connector for Claude, which calculates charts for requests from Claude and keeps nothing.</li>
<li><strong>Google Fonts</strong> serves the typefaces.</li></ul>
<p>Each processes data only to provide its service to us, under its own privacy policy.</p>
<h2>What we never do</h2>
<p>No advertising. No selling or sharing your data. No tracking across other apps or sites. No access to your contacts, photos, location or microphone.</p>
<h2>How long we keep data</h2>
<p>Account, membership and usage records are kept while your account exists. Booking records are kept while your account exists, or as long as the law requires for payment records. Optional usage events and crash reports are not linked to you, and are deleted when they are no longer needed to improve the app.</p>
<h2>Deleting your data</h2>
<ul><li><strong>On your device:</strong> Settings → Erase everything on this device.</li>
<li><strong>Your account:</strong> Settings → Account → Delete account. This cancels any subscription and permanently removes your account, membership record, usage counts and bookings from our servers.</li>
<li><strong>Without the app:</strong> to request deletion of your account and data, ${ask} from the address you signed in with. We act on requests within 30 days.</li></ul>
<p>Stripe keeps payment records it is required by law to keep.</p>
<h2>Your rights</h2>
<p>Depending on where you live, including the EU, UK and California, you can ask to access, correct, export or delete your data, or object to how it is used. Most of this you can do yourself in Settings. For anything else, ${ask}. We do not sell personal information.</p>
<h2>Security</h2>
<p>Data is encrypted in transit. Account records are protected by access rules, so each person can read only their own.</p>
<h2>Children</h2>
<p>Within is not intended for children under 13, and we do not knowingly collect their data. If you believe a child has created an account, ${ask} and we will delete it.</p>
<h2>Changes</h2>
<p>If this policy changes, we will update the date at the top. Significant changes will be shown in the app.</p>
${CONTACT ? `<h2>Contact</h2><p>Questions or requests: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>` : ''}`,
  });
}

// Link in bio (Instagram, TikTok): one tap to each thing worth opening.
function links() {
  const L: [string, string][] = [
    [SITE, 'Ask the Oracle, free'],
    [`${SITE}mercury-retrograde/`, 'Mercury retrograde: dates and your rising sign'],
    [`${SITE}moon-calendar/`, 'New and Full Moon calendar'],
    [`${SITE}synastry/`, 'Compare two charts'],
    [`${SITE}#/astrologer`, 'Seeking a live reading…'],
  ];
  pages.push({
    path: 'links/',
    title: 'Within · The Oracle: links',
    description: 'Ask the Oracle anything, free. Answers from your exact birth chart, Western and Vedic.',
    h1: 'Ask the stars anything',
    plain: true,
    body: `<p class="lede" style="text-align:center">Answers from your exact birth chart, Western and Vedic, in seconds.</p><div style="display:grid;gap:12px;margin:28px 0">${L.map(([h, t], i) => `<a class="btn" style="text-align:center;${i ? 'background:transparent;color:#f1e6d8;border:1px solid rgba(226,194,126,.6)' : ''}" href="${h}">${t}</a>`).join('')}</div>${proofHtml()}`,
  });
}

links();
moonCalendar();
retrogrades();
mercuryRetrograde();
zodiac();
guides();
privacy();

for (const p of pages) {
  const file = join(DIST, p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(p));
}
// The landing page: the proof strip and approved reviews, in the static HTML search engines read.
const landing = join(DIST, 'index.html');
const marker = '<p style="margin-top: 40px; font-size: 0.95rem">';
const home = readFileSync(landing, 'utf8');
if (home.includes(marker)) writeFileSync(landing, home.replace(marker, `${examplesHtml(1, ' style="text-align:left;margin-top:40px"')}${proofHtml(' style="list-style:none;padding:0;margin:32px 0 0;line-height:1.9"')}${reviewsHtml(' style="text-align:left"')}${marker}`));

const urls = ['', ...pages.map((p) => p.path)];
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`,
);
console.log(`SEO: ${REVIEWS.length} approved reviews; wrote ${pages.length} pages and a sitemap of ${urls.length} URLs for ${SITE}`);
