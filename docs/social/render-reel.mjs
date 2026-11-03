// Renders Instagram Reels and Stories as animated video (1080×1920 MP4, 30 fps, H.264 + AAC) from the app's
// own crystal ball: drifting stars, mist swirling inside the ball, a breathing glow, a flash of light on each
// reveal, text that rises in, and original composed music (music.py) with a chime on every reveal.
// Usage, with Playwright and ffmpeg installed:
//   node docs/social/render-reel.mjs reels docs/social/reels-2026-10.json app/public/social/reels <balls cache dir> [only-date]
//   node docs/social/render-reel.mjs stories docs/social/queue-2026-10.json app/public/social/stories <balls cache dir> [only-date]
// Balls missing from the cache are photographed from the app, so serve it first (see ball.mjs).
//
// Reel formats (see PLAN.md), each built from `hook` (burned-in text on top, `|` breaks lines) and `items`
// ({word, title?, line}; `word` goes inside the ball):
//   pause:  the ball flashes every item fast, three times round: "pause it, that's yours"
//   pick:   three balls numbered 1 2 3 to choose from, then each one revealed
//   signs:  the 12 signs flash past twice: "pause on yours"
//   scenes: the items one after another, `dur` seconds each (explainers, "send this to your ___ friend")
// Stories: today's message from a queue file, as a 7-second video plus a still JPEG.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';
import { openBoard, shootBall } from './ball.mjs';

const [mode, file, outDir, ballsDir, only] = process.argv.slice(2);
const entries = JSON.parse(readFileSync(file, 'utf8')).filter((e) => !only || e.date === only);
const FPS = 30;
mkdirSync(outDir, { recursive: true });
mkdirSync(ballsDir, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
let board;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blank';
async function ball(word) {
  const path = `${ballsDir}/${slug(word)}.png`;
  if (!existsSync(path)) {
    board ??= await openBoard(browser);
    await shootBall(board, word, path);
  }
  return `data:image/png;base64,${readFileSync(path).toString('base64')}`;
}

/** The timeline: scenes with start times, and the moments that get a chime. */
async function timeline(r) {
  const scenes = [];
  let t = 0;
  const add = async (s, dur) => {
    scenes.push({ ...s, img: s.trio || !s.word ? s.img : await ball(s.word), start: t, dur });
    t += dur;
  };
  const open = { word: r.open ?? 'PAUSE', line: r.openLine ?? '' };
  if (r.format === 'pick') {
    await add({ trio: true, img: await ball(open.word), line: 'Pause and choose. Answers next.', chime: true }, 3.5);
    for (const [i, it] of r.items.entries()) await add({ word: it.word, title: `BALL ${i + 1}${it.title ? ` · ${it.title}` : ''}`, line: it.line, chime: true, reveal: true }, 3.2);
  } else if (r.format === 'pause' || r.format === 'signs') {
    await add({ ...open, chime: true }, 1.6);
    const each = r.each ?? (r.format === 'signs' ? 0.55 : 0.45);
    const rounds = r.rounds ?? (r.format === 'signs' ? 2 : 3);
    for (let k = 0; k < rounds; k++) for (const it of r.items) await add({ ...it, flash: true }, each);
  } else {
    for (const it of r.items) await add({ ...it, hook: it.hook, chime: true, reveal: true }, it.dur ?? 3);
  }
  await add({ word: r.endWord ?? 'ASK', line: r.end ?? 'Ask your own question.|Link in bio ✦', hook: r.endHook, chime: true, reveal: true }, 2.5);
  return { scenes, total: t };
}

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=block" rel="stylesheet">
<style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#05071a}
#sky{position:absolute;inset:0}
#stage{position:absolute;left:0;top:0;width:1080px;height:1920px}
.ball{position:absolute;left:40px;top:430px;width:1000px;height:1003px;border-radius:44px;box-shadow:0 40px 120px #000c;overflow:hidden}
.ball img{width:100%;height:100%;display:block}
#mist{position:absolute;left:40px;top:430px;width:1000px;height:1003px;pointer-events:none;mix-blend-mode:screen}
#aura{position:absolute;left:40px;top:430px;width:1000px;height:1003px;pointer-events:none;mix-blend-mode:screen}
.brand{position:absolute;left:0;right:0;top:110px;text-align:center;letter-spacing:.32em;font:600 26px 'Source Sans 3',sans-serif;color:#d9b26a}
#hook{position:absolute;left:70px;right:110px;top:170px;height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:'Cormorant Garamond',serif;font-weight:600;color:#fbf5ea;line-height:1.04;text-shadow:0 4px 30px #000}
#hook span{display:block}
#below{position:absolute;left:70px;right:120px;top:1470px;text-align:center;font-family:'Source Sans 3',sans-serif}
#title{color:#e9c987;letter-spacing:.2em;font-size:30px;font-weight:600}
#line{margin-top:14px;font-size:50px;line-height:1.28;color:#f3ecf8;text-shadow:0 2px 20px #000}
.trio{position:absolute;top:640px;width:320px;height:321px;border-radius:26px;overflow:hidden;box-shadow:0 20px 60px #000c}
.trio img{width:100%;height:100%}
.num{position:absolute;top:990px;width:320px;text-align:center;font:600 130px 'Cormorant Garamond',serif;color:#e9c987;text-shadow:0 0 40px #e9c98799}
#flash{position:absolute;inset:0;background:radial-gradient(circle at 540px 930px,#fff8e6 0,#f3d9a0aa 22%,transparent 60%);opacity:0;pointer-events:none}
</style></head><body>
<canvas id="sky" width="1080" height="1920"></canvas>
<div id="stage"></div>
<canvas id="aura" width="1000" height="1003"></canvas>
<canvas id="mist" width="1000" height="1003"></canvas>
<div class="brand">WITHIN · THE ORACLE</div>
<div id="hook"></div>
<div id="below"><div id="title"></div><div id="line"></div></div>
<div id="flash"></div>
<script>
// Seeded randomness, so every frame of a reel draws the same sky.
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const STARS = Array.from({ length: 260 }, () => ({ x: rnd() * 1080, y: rnd() * 1920, r: 0.4 + rnd() * 1.8, s: 4 + rnd() * 14, p: rnd() * 6.28 }));
const DUST = Array.from({ length: 46 }, () => ({ a: rnd() * 6.28, d: 230 + rnd() * 260, v: 0.1 + rnd() * 0.25, s: 1 + rnd() * 2.5, p: rnd() * 6.28 }));
const BLOBS = Array.from({ length: 7 }, (_, i) => ({ r: 50 + rnd() * 120, o: 30 + rnd() * 110, v: (0.25 + rnd() * 0.5) * (i % 2 ? 1 : -1), p: rnd() * 6.28, c: ['155,120,255', '233,201,135', '120,200,255', '255,150,210'][i % 4] }));
// The sphere inside the ball image: centre at the middle, radius 18.8% of the width.
const CX = 500, CY = 500, R = 188;
let D = null, lastKey = '';
window.setData = (d) => { D = d; lastKey = ''; }; // a new entry must rebuild the stage, or every story shows the first one
const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));
const ease = (k) => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);

function sky(t) {
  const c = document.getElementById('sky').getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 1920);
  g.addColorStop(0, '#04061a'); g.addColorStop(0.5, '#0c1238'); g.addColorStop(1, '#1d1330');
  c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
  for (const s of STARS) {
    const y = (s.y + t * s.s) % 1920;
    c.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + s.p));
    c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, y, s.r, 0, 6.28); c.fill();
  }
  c.globalAlpha = 1;
}
function aura(t, boost) {
  const c = document.getElementById('aura').getContext('2d');
  c.clearRect(0, 0, 1000, 1003);
  const k = 0.55 + 0.25 * Math.sin(t * 2.2) + boost;
  const g = c.createRadialGradient(CX, CY, R * 0.6, CX, CY, R * 2.1);
  g.addColorStop(0, 'rgba(160,140,255,' + 0.0 + ')'); g.addColorStop(0.35, 'rgba(170,150,255,' + 0.28 * k + ')'); g.addColorStop(1, 'rgba(120,100,220,0)');
  c.fillStyle = g; c.fillRect(0, 0, 1000, 1003);
  for (const d of DUST) {
    const a = d.a + t * d.v; const rr = d.d + 18 * Math.sin(t + d.p);
    c.globalAlpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3 + d.p));
    c.fillStyle = '#f6e3b4'; c.beginPath(); c.arc(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.92, d.s, 0, 6.28); c.fill();
  }
  c.globalAlpha = 1;
}
function mist(t, boost) {
  const c = document.getElementById('mist').getContext('2d');
  c.clearRect(0, 0, 1000, 1003);
  c.save(); c.beginPath(); c.arc(CX, CY, R - 4, 0, 6.28); c.clip();
  c.globalCompositeOperation = 'lighter';
  for (const b of BLOBS) {
    const a = b.p + t * b.v;
    const x = CX + Math.cos(a) * b.o, y = CY + Math.sin(a * 1.3) * b.o * 0.7;
    const g = c.createRadialGradient(x, y, 0, x, y, b.r);
    g.addColorStop(0, 'rgba(' + b.c + ',' + (0.22 + boost * 0.5) + ')'); g.addColorStop(1, 'rgba(' + b.c + ',0)');
    c.fillStyle = g; c.fillRect(x - b.r, y - b.r, b.r * 2, b.r * 2);
  }
  c.restore();
}
window.renderAt = (t) => {
  const s = D.scenes.find((x) => t >= x.start && t < x.start + x.dur) ?? D.scenes[D.scenes.length - 1];
  const local = t - s.start;
  const key = D.scenes.indexOf(s);
  const stage = document.getElementById('stage');
  if (key + '' !== lastKey) {
    lastKey = key + '';
    stage.innerHTML = s.trio
      ? [0, 1, 2].map((i) => '<div class="trio" style="left:' + (40 + i * 345) + 'px"><img src="' + s.img + '"></div><div class="num" style="left:' + (40 + i * 345) + 'px">' + (i + 1) + '</div>').join('')
      : '<div class="ball"><img src="' + s.img + '"></div>';
    const hook = (s.hook ?? D.hook ?? '').split('|');
    const long = hook.join(' ').length > 60;
    document.getElementById('hook').innerHTML = hook.map((h) => '<span style="font-size:' + (long ? 70 : 84) + 'px">' + h.replace(/</g, '&lt;') + '</span>').join('');
    document.getElementById('title').textContent = s.title ?? '';
    document.getElementById('line').innerHTML = (s.line ?? '').split('|').map((x) => x.replace(/</g, '&lt;')).join('<br>');
  }
  sky(t);
  const reveal = s.flash ? 0 : Math.max(0, 1 - local / 0.6);
  const showBall = !s.trio;
  document.getElementById('mist').style.opacity = showBall ? 1 : 0;
  document.getElementById('aura').style.opacity = showBall ? 1 : 0;
  if (showBall) { aura(t, reveal * 0.6); mist(t, reveal); }
  // The ball breathes and slowly comes closer; each reveal starts it a little smaller.
  // Inside the card the ball is shown 1.35× close, so the sphere and its word fill the screen.
  const b = stage.querySelector('.ball img');
  if (b) {
    const z = 1.35 * (1 + 0.012 * Math.sin(t * 2.2)) * (s.flash ? 1.02 : lerp(0.94, 1.0, ease(local / 0.5)) * (1 + 0.025 * Math.min(local, s.dur) / s.dur));
    b.style.transform = 'scale(' + z.toFixed(4) + ')';
    for (const id of ['mist', 'aura']) document.getElementById(id).style.transform = b.style.transform;
  }
  stage.querySelectorAll('.trio').forEach((el, i) => (el.style.transform = 'translateY(' + (8 * Math.sin(t * 2 + i * 2.1)).toFixed(2) + 'px)'));
  // Hook lines rise in at the start; the line under the ball follows.
  const first = D.scenes[0] === s || s.hook;
  document.querySelectorAll('#hook span').forEach((el, i) => {
    const k = first ? ease((local - i * 0.18) / 0.5) : 1;
    el.style.opacity = k.toFixed(3); el.style.transform = 'translateY(' + ((1 - k) * 30).toFixed(1) + 'px)';
  });
  const k2 = s.flash ? 1 : ease((local - 0.25) / 0.5);
  const below = document.getElementById('below');
  below.style.opacity = k2.toFixed(3); below.style.transform = 'translateY(' + ((1 - k2) * 24).toFixed(1) + 'px)';
  document.getElementById('flash').style.opacity = (s.flash ? Math.max(0, 0.18 - local / 0.12 * 0.18) : reveal * 0.7).toFixed(3);
};
</script></body></html>`;

const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.setContent(PAGE, { waitUntil: 'networkidle' });

/** The sound: a slow ambient chord with a chime on each reveal and a soft shimmer under fast flashes. All original. */
function sound(scenes, total, withMusic = false) {
  const pad = `0.035*sin(2*PI*110*t)+0.03*sin(2*PI*164.81*t)*(0.7+0.3*sin(2*PI*0.2*t))+0.022*sin(2*PI*220*t)+0.016*sin(2*PI*277.18*t)*(0.6+0.4*sin(2*PI*0.13*t))+0.012*sin(2*PI*329.63*t)`;
  const chimes = scenes
    .filter((s) => s.chime)
    .map((s) => s.start.toFixed(2))
    .map((T) => `if(gte(t,${T}),0.16*exp(-2.6*(t-${T}))*(sin(2*PI*1318.5*(t-${T}))+0.45*sin(2*PI*1975.5*(t-${T}))+0.25*sin(2*PI*2637*(t-${T}))),0)`);
  const ticks = scenes
    .filter((s) => s.flash)
    .map((s) => s.start.toFixed(2))
    .map((T) => `if(gte(t,${T}),0.035*exp(-18*(t-${T}))*sin(2*PI*2093*(t-${T})),0)`);
  // With a composed track underneath, the drone pad steps aside and only the chimes and ticks stay.
  return withMusic ? [...chimes, ...ticks, '0'].join('+') : [pad, ...chimes, ...ticks].join('+');
}


// Composed music (docs/social/music.py): a track chosen by the post's subject, or by the date, so
// neighbouring days sound different. An entry can name one with "music": "oracle".
const MUSIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'music');
const MUSIC = ['oracle', 'moonlight', 'venus', 'scorpio', 'pulse', 'dawn'];
function pickMusic(data) {
  const text = `${data.music ?? ''} ${data.hook ?? ''} ${(data.scenes ?? []).map((s) => `${s.title ?? ''} ${s.line ?? ''}`).join(' ')}`.toLowerCase();
  const byWord = data.music ?? (/scorpio|pluto|eclipse|shadow/.test(text) ? 'scorpio' : /venus|love|heart/.test(text) ? 'venus' : /full moon|new moon|moon/.test(text) ? 'moonlight' : /countdown|tonight|now|starts/.test(text) ? 'pulse' : null);
  let hash = 0;
  for (const c of String(data.key ?? text)) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const name = byWord ?? MUSIC[hash % MUSIC.length];
  const file = resolve(MUSIC_DIR, `${name}.m4a`);
  return existsSync(file) ? { file, offset: (hash % 6) * 8 } : null;
}

async function render(name, data) {
  const tmp = resolve(outDir, `.${name}`);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp);
  await page.evaluate((d) => window.setData(d), data);
  const frames = Math.round(data.total * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.renderAt(t), f / FPS);
    await page.screenshot({ path: `${tmp}/${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 });
  }
  const track = pickMusic({ key: name, ...data });
  const expr = sound(data.scenes, data.total, !!track);
  const fade = `afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, data.total - 0.8).toFixed(2)}:d=0.8`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', `${tmp}/%05d.jpg`,
    '-f', 'lavfi', '-i', `aevalsrc=exprs='${expr}':s=48000:d=${data.total.toFixed(2)}`,
    ...(track ? ['-stream_loop', '-1', '-ss', String(track.offset), '-i', track.file] : []),
    ...(track
      ? ['-filter_complex', `[1:a]lowpass=f=6000,volume=1.3,aformat=channel_layouts=stereo:sample_rates=48000[fx];[2:a]aresample=48000,volume=0.85[m];[m][fx]amix=inputs=2:normalize=0,${fade}[a]`, '-map', '0:v', '-map', '[a]']
      : ['-af', `lowpass=f=6000,${fade},volume=1.6`]),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-t', data.total.toFixed(2), '-movflags', '+faststart',
    `${outDir}/${name}.mp4`,
  ]);
  // Cover: the first reveal, fully in.
  const coverAt = Math.min(data.total - 0.1, (data.scenes[0].dur ?? 1) * 0.9);
  await page.evaluate((t) => window.renderAt(t), coverAt);
  await page.screenshot({ path: `${outDir}/${name}${mode === 'stories' ? '' : '-cover'}.jpg`, type: 'jpeg', quality: 90 });
  rmSync(tmp, { recursive: true, force: true });
  console.log(mode === 'stories' ? 'story' : 'reel', name, `${data.total.toFixed(1)}s`, `${frames} frames`);
}

if (mode === 'stories') {
  // Today's message: the day's ball, title and first line, breathing for seven seconds.
  for (const p of entries.filter((e) => e.orb)) {
    await render(p.date, { hook: p.title, total: 7, scenes: [{ img: await ball(p.orb), title: p.kicker, line: p.lines[0], start: 0, dur: 7, chime: true, reveal: true }] });
  }
} else {
  for (const r of entries) {
    const { scenes, total } = await timeline(r);
    await render(r.date, { hook: r.hook, scenes, total });
  }
}
await browser.close();
