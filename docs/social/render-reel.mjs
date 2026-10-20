// Renders interactive Reels (1080×1920 MP4, H.264 + silent AAC, the format Instagram's publishing API takes)
// and daily Story images from the app's own crystal ball.
// Usage, with Playwright and ffmpeg installed:
//   node docs/social/render-reel.mjs reels docs/social/reels-2026-10.json app/public/social/reels <balls cache dir>
//   node docs/social/render-reel.mjs stories docs/social/queue-2026-10.json app/public/social/stories <balls cache dir>
// Balls missing from the cache are photographed from the app, so serve it first (see ball.mjs).
//
// Reel formats (see PLAN.md), each built from `hook` (burned-in text on top, `|` breaks lines) and `items`
// ({word, title?, line}; `word` goes inside the ball):
//   pause:  the ball flashes every item fast, three times round: "pause it, that's yours"
//   pick:   three balls numbered 1 2 3 to choose from, then each one revealed
//   signs:  the 12 signs flash past twice: "pause on yours"
//   scenes: the items one after another, `dur` seconds each (explainers, "send this to your ___ friend")
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { openBoard, shootBall } from './ball.mjs';

const [mode, file, outDir, ballsDir] = process.argv.slice(2);
const entries = JSON.parse(readFileSync(file, 'utf8'));
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

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const lines = (s = '') => s.split('|').map(esc).join('<br>');
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=block" rel="stylesheet">`;
// Instagram covers the bottom ~320px and the right edge with its buttons: text stays above and inside.
const frame = (body, hook) => `<html><head>${FONTS}</head>
<body style="margin:0;width:1080px;height:1920px;overflow:hidden;font-family:'Source Sans 3',sans-serif;background:linear-gradient(180deg,#070a1f 0%,#0d1336 45%,#1a1530 100%);color:#fbf5ea;position:relative">
<div style="position:absolute;left:0;right:0;top:120px;text-align:center;letter-spacing:.3em;font-size:26px;color:#d9b26a">WITHIN · THE ORACLE</div>
<div style="position:absolute;left:70px;right:110px;top:190px;height:330px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:${hook && hook.length > 60 ? 66 : 80}px;line-height:1.05">${lines(hook)}</div>
${body}
</body></html>`;
const single = (img, item) => `
<img src="${img}" style="position:absolute;left:110px;top:560px;width:860px;height:860px;border-radius:40px;box-shadow:0 30px 80px #0009">
<div style="position:absolute;left:80px;right:120px;top:1450px;text-align:center">
  ${item.title ? `<div style="color:#d9b26a;letter-spacing:.2em;font-size:30px;font-weight:600">${esc(item.title)}</div>` : ''}
  ${item.line ? `<p style="margin:14px 0 0;font-size:42px;line-height:1.3;color:#e6dcf0">${lines(item.line)}</p>` : ''}
</div>`;
const trio = (img) => `
${[0, 1, 2].map((i) => `<img src="${img}" style="position:absolute;left:${60 + i * 330}px;top:760px;width:300px;height:300px;border-radius:24px;box-shadow:0 20px 50px #0009">
<div style="position:absolute;left:${60 + i * 330}px;width:300px;top:1090px;text-align:center;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:120px;color:#e9c987">${i + 1}</div>`).join('')}
<div style="position:absolute;left:80px;right:120px;top:1300px;text-align:center;font-size:42px;color:#e6dcf0">Pause and choose. Answers next.</div>`;

const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
async function shot(html, path, type = 'png') {
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(150);
  await page.screenshot({ path, type, ...(type === 'jpeg' ? { quality: 90 } : {}) });
}

if (mode === 'stories') {
  // Today's message as a Story: the day's ball, title and first line, upright.
  for (const p of entries.filter((e) => e.orb)) {
    await shot(frame(single(await ball(p.orb), { title: p.kicker, line: p.lines[0] }), p.title), `${outDir}/${p.date}.jpg`, 'jpeg');
    console.log('story', p.date);
  }
} else {
  for (const r of entries) {
    const tmp = resolve(outDir, `.${r.date}`);
    rmSync(tmp, { recursive: true, force: true });
    mkdirSync(tmp);
    const seq = []; // [png, seconds]
    let n = 0;
    const add = async (html, secs) => {
      const path = `${tmp}/${String(n++).padStart(3, '0')}.png`;
      await shot(html, path);
      seq.push([path, secs]);
      return path;
    };
    const open = { word: r.open ?? 'PAUSE', line: r.openLine ?? '' };
    if (r.format === 'pick') {
      await add(frame(trio(await ball(open.word)), r.hook), 3.5);
      for (const [i, it] of r.items.entries()) await add(frame(single(await ball(it.word), { title: `BALL ${i + 1}${it.title ? ` · ${it.title}` : ''}`, line: it.line }), r.hook), 3.2);
    } else if (r.format === 'pause' || r.format === 'signs') {
      await add(frame(single(await ball(open.word), open), r.hook), 1.6);
      const frames = [];
      for (const it of r.items) frames.push(await add(frame(single(await ball(it.word), it), r.hook), 0));
      seq.splice(-frames.length);
      const each = r.each ?? (r.format === 'signs' ? 0.55 : 0.45);
      for (let round = 0; round < (r.rounds ?? (r.format === 'signs' ? 2 : 3)); round++) for (const f of frames) seq.push([f, each]);
    } else {
      for (const it of r.items) await add(frame(single(await ball(it.word), it), it.hook ?? r.hook), it.dur ?? 3);
    }
    await add(frame(single(await ball(r.endWord ?? 'ASK'), { line: r.end ?? 'Ask your own question.|Link in bio ✦' }), r.endHook ?? r.hook), 2.5);
    // The concat list needs the last frame twice so its duration counts.
    const list = seq.map(([f, s]) => `file '${f}'\nduration ${s}`).join('\n') + `\nfile '${seq.at(-1)[0]}'\n`;
    writeFileSync(`${tmp}/list.txt`, list);
    const total = seq.reduce((a, [, s]) => a + s, 0);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', String(total), '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', `${outDir}/${r.date}.mp4`]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', seq[0][0], '-q:v', '3', `${outDir}/${r.date}-cover.jpg`]);
    rmSync(tmp, { recursive: true, force: true });
    console.log('reel', r.date, r.format, `${total.toFixed(1)}s`);
  }
}
await browser.close();
